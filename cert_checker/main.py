from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, HttpUrl
import ssl
import socket
import OpenSSL
from datetime import datetime
import requests
from typing import Optional, List

app = FastAPI(title="Certificate Checker Service")

class CertificateCheck(BaseModel):
    url: HttpUrl
    port: Optional[int] = 443

class CertificateInfo(BaseModel):
    subject: str
    issuer: str
    valid_from: str
    valid_until: str
    serial_number: str
    version: int
    expired: bool
    days_to_expire: int

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/check-cert", response_model=CertificateInfo)
async def check_certificate(cert_check: CertificateCheck):
    try:
        hostname = str(cert_check.url).split("://")[1].split("/")[0]
        context = ssl.create_default_context()
        with socket.create_connection((hostname, cert_check.port)) as sock:
            with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                cert = ssock.getpeercert(binary_form=True)
                x509 = OpenSSL.crypto.load_certificate(OpenSSL.crypto.FILETYPE_ASN1, cert)
                
                # Convert to datetime
                valid_from = datetime.strptime(x509.get_notBefore().decode('ascii'), '%Y%m%d%H%M%SZ')
                valid_until = datetime.strptime(x509.get_notAfter().decode('ascii'), '%Y%m%d%H%M%SZ')
                current_time = datetime.now()
                
                days_to_expire = (valid_until - current_time).days
                
                return CertificateInfo(
                    subject=str(x509.get_subject().get_components()),
                    issuer=str(x509.get_issuer().get_components()),
                    valid_from=valid_from.isoformat(),
                    valid_until=valid_until.isoformat(),
                    serial_number=str(x509.get_serial_number()),
                    version=x509.get_version(),
                    expired=current_time > valid_until,
                    days_to_expire=days_to_expire
                )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error checking certificate: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
