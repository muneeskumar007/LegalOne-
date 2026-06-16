"""
routers/auth_router.py — Signup, login, profile, update, change-password.
"""

from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, EmailStr, field_validator
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional

from database import get_db, Advocate, generate_id
from auth import (
    hash_password, verify_password,
    create_access_token, get_current_advocate
)

router = APIRouter()


# ── Schemas ───────────────────────────────────────────────────────────────────

class SignupRequest(BaseModel):
    name:       str
    email:      str
    password:   str
    bar_number: Optional[str] = None
    court:      Optional[str] = None
    phone:      Optional[str] = None

    @field_validator("password")
    @classmethod
    def password_strength(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v):
        if not v.strip():
            raise ValueError("Name cannot be empty")
        return v.strip()


class LoginRequest(BaseModel):
    email:    str
    password: str


class ProfileUpdate(BaseModel):
    name:       Optional[str] = None
    bar_number: Optional[str] = None
    court:      Optional[str] = None
    phone:      Optional[str] = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password:     str

    @field_validator("new_password")
    @classmethod
    def pw_length(cls, v):
        if len(v) < 6:
            raise ValueError("New password must be at least 6 characters")
        return v


def _advocate_dict(adv: Advocate) -> dict:
    return {
        "id":          adv.id,
        "name":        adv.name,
        "email":       adv.email,
        "bar_number":  adv.bar_number,
        "court":       adv.court,
        "phone":       adv.phone,
        "created_at":  adv.created_at.isoformat() if adv.created_at else None,
        "last_login":  adv.last_login.isoformat() if adv.last_login else None,
    }


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/auth/signup", status_code=201)
def signup(req: SignupRequest, db: Session = Depends(get_db)):
    existing = db.query(Advocate).filter(Advocate.email == req.email.lower().strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    advocate = Advocate(
        id             = generate_id(),
        name           = req.name,
        email          = req.email.lower().strip(),
        hashed_password= hash_password(req.password),
        bar_number     = req.bar_number,
        court          = req.court,
        phone          = req.phone,
    )
    db.add(advocate)
    db.commit()
    db.refresh(advocate)

    token = create_access_token({"sub": advocate.email, "name": advocate.name})
    return {
        "success":      True,
        "access_token": token,
        "token_type":   "bearer",
        "advocate":     _advocate_dict(advocate),
        "message":      f"Welcome to LegalOne, {advocate.name}!"
    }


@router.post("/auth/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    advocate = db.query(Advocate).filter(
        Advocate.email == req.email.lower().strip(),
        Advocate.is_active == True
    ).first()

    if not advocate or not verify_password(req.password, advocate.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Update last_login
    advocate.last_login = datetime.utcnow()
    db.commit()

    token = create_access_token({"sub": advocate.email, "name": advocate.name})
    return {
        "success":      True,
        "access_token": token,
        "token_type":   "bearer",
        "advocate":     _advocate_dict(advocate),
        "message":      f"Welcome back, {advocate.name}!"
    }


@router.get("/auth/me")
def get_me(advocate: Advocate = Depends(get_current_advocate)):
    return {"success": True, "advocate": _advocate_dict(advocate)}


@router.put("/auth/profile")
def update_profile(
    req: ProfileUpdate,
    advocate: Advocate = Depends(get_current_advocate),
    db: Session = Depends(get_db)
):
    if req.name       is not None: advocate.name       = req.name.strip()
    if req.bar_number is not None: advocate.bar_number = req.bar_number
    if req.court      is not None: advocate.court      = req.court
    if req.phone      is not None: advocate.phone      = req.phone
    db.commit()
    db.refresh(advocate)
    return {"success": True, "advocate": _advocate_dict(advocate)}


@router.put("/auth/change-password")
def change_password(
    req: ChangePasswordRequest,
    advocate: Advocate = Depends(get_current_advocate),
    db: Session = Depends(get_db)
):
    if not verify_password(req.current_password, advocate.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    advocate.hashed_password = hash_password(req.new_password)
    db.commit()
    return {"success": True, "message": "Password changed successfully"}


@router.delete("/auth/account")
def delete_account(
    advocate: Advocate = Depends(get_current_advocate),
    db: Session = Depends(get_db)
):
    advocate.is_active = False
    db.commit()
    return {"success": True, "message": "Account deactivated"}
