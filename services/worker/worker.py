from celery import Celery
from datetime import datetime
import ssl
import socket
import OpenSSL
import requests
from urllib.parse import urlparse
from sqlalchemy import create_engine, Column, Integer, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Celery('app',
            broker=os.getenv('REDIS_URL', 'redis://redis:6379/0'),
            backend=os.getenv('REDIS_URL', 'redis://redis:6379/0'))

app.conf.update(
    task_default_queue='celery',
    task_routes={
        'app.tasks.check_certificate': {'queue': 'celery'}
    },
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    enable_utc=True,
)

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
                
                return {
                    'issuer': issuer_str,
                    'subject': subject_str,
                    'valid_from': valid_from,
                    'valid_until': valid_until,
                    'status': 'valid'
                }
    except Exception as e:
        logger.error(f"Error checking certificate for {url}: {str(e)}")
        return {
            'issuer': None,
            'subject': None,
            'valid_from': None,
            'valid_until': None,
            'status': f'error: {str(e)}'
        }

@app.task(name='app.tasks.check_certificate', bind=True, max_retries=3)
def check_certificate(self, cert_id):
    """Check certificate information for a given certificate ID."""
    session = Session()
    try:
        logger.info(f"Processing certificate ID: {cert_id}")
        cert = session.query(Certificate).get(cert_id)
        if not cert:
            logger.error(f"Certificate not found: {cert_id}")
            return {'error': 'Certificate not found'}

        cert_info = get_certificate_info(cert.url)
        
        cert.issuer = cert_info['issuer']
        cert.subject = cert_info['subject']
        cert.valid_from = cert_info['valid_from']
        cert.valid_until = cert_info['valid_until']
        cert.status = cert_info['status']
        cert.last_checked = datetime.utcnow()
        cert.updated_at = datetime.utcnow()
        
        session.commit()
        logger.info(f"Successfully updated certificate {cert_id}")
        return {'success': True, 'cert_id': cert_id}
    except Exception as e:
        logger.error(f"Error processing certificate {cert_id}: {str(e)}")
        session.rollback()
        # Retry the task if it fails
        raise self.retry(exc=e, countdown=60)  # Retry after 60 seconds
    finally:
        session.close()
