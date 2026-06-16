"""
database.py — SQLite database setup with SQLAlchemy.
Stores advocates, sessions, and case history for all modules.
"""

from sqlalchemy import (
    create_engine, Column, String, Text, DateTime,
    Integer, Float, Boolean, ForeignKey
)
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from datetime import datetime
import uuid

DATABASE_URL = "sqlite:///./legalone.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def generate_id():
    return str(uuid.uuid4())


# ── Models ────────────────────────────────────────────────────────────────────

class Advocate(Base):
    __tablename__ = "advocates"

    id            = Column(String, primary_key=True, default=generate_id)
    name          = Column(String(120), nullable=False)
    email         = Column(String(180), unique=True, nullable=False, index=True)
    bar_number    = Column(String(60), nullable=True)
    court         = Column(String(120), nullable=True)       # district/high court
    phone         = Column(String(20), nullable=True)
    hashed_password = Column(String, nullable=False)
    is_active     = Column(Boolean, default=True)
    created_at    = Column(DateTime, default=datetime.utcnow)
    last_login    = Column(DateTime, nullable=True)

    cases = relationship("CaseHistory", back_populates="advocate", cascade="all, delete-orphan")


class CaseHistory(Base):
    """One record per saved case across any module."""
    __tablename__ = "case_history"

    id            = Column(String, primary_key=True, default=generate_id)
    advocate_id   = Column(String, ForeignKey("advocates.id"), nullable=False, index=True)

    # Which module created this
    module        = Column(String(40), nullable=False)  # pipeline|draft|arguments|validate|compare

    # Raw input stored
    raw_input     = Column(Text, nullable=False)
    title         = Column(String(200), nullable=True)        # auto-generated short title

    # Extracted metadata (stored as JSON strings)
    plaintiff_name = Column(String(120), nullable=True)
    defendant_name = Column(String(120), nullable=True)
    amount         = Column(String(60),  nullable=True)
    case_type      = Column(String(80),  nullable=True)
    court          = Column(String(120), nullable=True)

    # Generated outputs
    draft_text    = Column(Text, nullable=True)
    validation_score = Column(Float, nullable=True)
    argument_text = Column(Text, nullable=True)
    compare_result = Column(Text, nullable=True)              # JSON string

    # Meta
    draft_source  = Column(String(40), nullable=True)         # ollama_llm | template
    is_starred    = Column(Boolean, default=False)
    notes         = Column(Text, nullable=True)               # advocate's personal notes
    created_at    = Column(DateTime, default=datetime.utcnow)
    updated_at    = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    advocate = relationship("Advocate", back_populates="cases")


def create_tables():
    Base.metadata.create_all(bind=engine)


# Auto-create on import
create_tables()
