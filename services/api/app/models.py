from datetime import datetime
from . import db

class Certificate(db.Model):
    __tablename__ = 'certificates'

    id = db.Column(db.Integer, primary_key=True)
    url = db.Column(db.String(255), unique=True, nullable=False, index=True)
    issuer = db.Column(db.String(255))
    subject = db.Column(db.String(255))
    serial_number = db.Column(db.String(255))
    valid_from = db.Column(db.DateTime)
    valid_until = db.Column(db.DateTime)
    last_checked = db.Column(db.DateTime)
    status = db.Column(db.String(50))  # valid, expired, error
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'url': self.url,
            'issuer': self.issuer,
            'subject': self.subject,
            'serial_number': self.serial_number,
            'valid_from': self.valid_from.isoformat() if self.valid_from else None,
            'valid_until': self.valid_until.isoformat() if self.valid_until else None,
            'last_checked': self.last_checked.isoformat() if self.last_checked else None,
            'status': self.status,
            'days_remaining': (self.valid_until - datetime.utcnow()).days if self.valid_until else None
        }
