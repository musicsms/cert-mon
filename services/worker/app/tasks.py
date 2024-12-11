from datetime import datetime
import ssl
import socket
import OpenSSL
from urllib.parse import urlparse
from sqlalchemy import create_engine, Column, Integer, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
import logging
from . import app

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database setup
engine = create_engine(os.getenv('DATABASE_URL'))
Session = sessionmaker(bind=engine)

# Define the Certificate model for the worker
Base = declarative_base()

class Certificate(Base):
    __tablename__ = 'certificates'

    id = Column(Integer, primary_key=True)
    url = Column(String(255), unique=True, nullable=False)
    issuer = Column(String(255))
    subject = Column(String(255))
    serial_number = Column(String(255))
    valid_from = Column(DateTime)
    valid_until = Column(DateTime)
    last_checked = Column(DateTime)
    status = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

def get_certificate_info(url):
    """Get SSL certificate information for a given URL."""
    try:
        logger.info(f"Checking certificate for URL: {url}")
        if not url.startswith(('http://', 'https://')):
            url = f'https://{url}'
        
        parsed = urlparse(url)
        hostname = parsed.netloc
        if ':' in hostname:
            hostname = hostname.split(':')[0]

        context = ssl.create_default_context()
        with socket.create_connection((hostname, 443)) as sock:
            with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                cert = ssock.getpeercert(binary_form=True)
                x509 = OpenSSL.crypto.load_certificate(OpenSSL.crypto.FILETYPE_ASN1, cert)
                
                issuer = x509.get_issuer().get_components()
                subject = x509.get_subject().get_components()
                valid_from = datetime.strptime(x509.get_notBefore().decode('ascii'), '%Y%m%d%H%M%SZ')
                valid_until = datetime.strptime(x509.get_notAfter().decode('ascii'), '%Y%m%d%H%M%SZ')
                
                issuer_str = ', '.join([f"{k.decode('utf-8')}={v.decode('utf-8')}" for k, v in issuer])
                subject_str = ', '.join([f"{k.decode('utf-8')}={v.decode('utf-8')}" for k, v in subject])
                serial_number = format(x509.get_serial_number(), 'x').upper()  # Convert to uppercase hex
                
                return {
                    'issuer': issuer_str,
                    'subject': subject_str,
                    'serial_number': serial_number,
                    'valid_from': valid_from,
                    'valid_until': valid_until,
                    'status': 'valid'
                }
    except Exception as e:
        logger.error(f"Error checking certificate for {url}: {str(e)}")
        return {
            'issuer': None,
            'subject': None,
            'serial_number': None,
            'valid_from': None,
            'valid_until': None,
            'status': f'error: {str(e)}'
        }

@app.task(name='app.tasks.check_certificate')
def check_certificate(cert_id):
    """Check certificate information for a given certificate ID."""
    session = Session()
    try:
        logger.info(f"Checking certificate for ID: {cert_id}")
        cert = session.query(Certificate).get(cert_id)
        if not cert:
            logger.error(f"Certificate not found for ID: {cert_id}")
            return

        cert_info = get_certificate_info(cert.url)
        
        # Update certificate information
        cert.issuer = cert_info['issuer']
        cert.subject = cert_info['subject']
        cert.serial_number = cert_info['serial_number']
        cert.valid_from = cert_info['valid_from']
        cert.valid_until = cert_info['valid_until']
        cert.last_checked = datetime.utcnow()
        cert.status = cert_info['status']
        cert.updated_at = datetime.utcnow()
        
        session.commit()
        logger.info(f"Certificate updated for ID: {cert_id}")
    except Exception as e:
        logger.error(f"Error checking certificate {cert_id}: {str(e)}")
        session.rollback()
        # Update status to error if something goes wrong
        try:
            cert = session.query(Certificate).get(cert_id)
            if cert:
                cert.status = 'error'
                cert.last_checked = datetime.utcnow()
                cert.updated_at = datetime.utcnow()
                session.commit()
        except:
            session.rollback()
    finally:
        session.close()

@app.task(name='app.tasks.check_all_certificates')
def check_all_certificates():
    """Check all certificates in the database."""
    session = Session()
    try:
        certificates = session.query(Certificate).all()
        for cert in certificates:
            # Schedule individual certificate checks
            check_certificate.delay(cert.id)
        logger.info(f"Scheduled checks for {len(certificates)} certificates")
    except Exception as e:
        logger.error(f"Error scheduling certificate checks: {str(e)}")
    finally:
        session.close()
