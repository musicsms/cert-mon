from sqlalchemy import Column, Integer, String, DateTime, Boolean, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/certmon")

Base = declarative_base()

class Certificate(Base):
    __tablename__ = "certificates"

    id = Column(Integer, primary_key=True, index=True)
    url = Column(String, index=True)
    port = Column(Integer)
    subject = Column(String)
    issuer = Column(String)
    valid_from = Column(DateTime)
    valid_until = Column(DateTime)
    serial_number = Column(String)
    version = Column(Integer)
    expired = Column(Boolean)
    days_to_expire = Column(Integer)
    last_checked = Column(DateTime)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    Base.metadata.create_all(bind=engine)
