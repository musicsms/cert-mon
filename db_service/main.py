from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List
from . import models
from pydantic import BaseModel

app = FastAPI(title="Certificate Database Service")

class CertificateBase(BaseModel):
    url: str
    port: int
    subject: str
    issuer: str
    valid_from: datetime
    valid_until: datetime
    serial_number: str
    version: int
    expired: bool
    days_to_expire: int

class CertificateCreate(CertificateBase):
    pass

class Certificate(CertificateBase):
    id: int
    last_checked: datetime

    class Config:
        orm_mode = True

def get_db():
    db = models.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/certificates/", response_model=Certificate)
def create_certificate(cert: CertificateCreate, db: Session = Depends(get_db)):
    db_cert = models.Certificate(
        **cert.dict(),
        last_checked=datetime.now()
    )
    db.add(db_cert)
    db.commit()
    db.refresh(db_cert)
    return db_cert

@app.get("/certificates/", response_model=List[Certificate])
def list_certificates(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    certificates = db.query(models.Certificate).offset(skip).limit(limit).all()
    return certificates

@app.get("/certificates/{cert_id}", response_model=Certificate)
def get_certificate(cert_id: int, db: Session = Depends(get_db)):
    cert = db.query(models.Certificate).filter(models.Certificate.id == cert_id).first()
    if cert is None:
        raise HTTPException(status_code=404, detail="Certificate not found")
    return cert

@app.get("/certificates/expiring/{days}", response_model=List[Certificate])
def get_expiring_certificates(days: int, db: Session = Depends(get_db)):
    certs = db.query(models.Certificate).filter(models.Certificate.days_to_expire <= days).all()
    return certs

if __name__ == "__main__":
    import uvicorn
    models.init_db()
    uvicorn.run(app, host="0.0.0.0", port=8001)
