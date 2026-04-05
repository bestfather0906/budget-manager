from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.payment_method import PaymentMethod
from app.schemas.payment_method import (
    PaymentMethodCreate,
    PaymentMethodListResponse,
    PaymentMethodResponse,
    PaymentMethodUpdate,
    _mask_number,
)

router = APIRouter(tags=["payment-methods"])


@router.get("/payment-methods", response_model=PaymentMethodListResponse)
def list_payment_methods(active_only: bool = False, db: Session = Depends(get_db)):
    q = db.query(PaymentMethod)
    if active_only:
        q = q.filter(PaymentMethod.is_active == True)  # noqa: E712
    items = q.order_by(PaymentMethod.created_at.asc()).all()
    return PaymentMethodListResponse(items=items, total_count=len(items))


@router.post("/payment-methods", response_model=PaymentMethodResponse, status_code=201)
def create_payment_method(body: PaymentMethodCreate, db: Session = Depends(get_db)):
    masked = _mask_number(body.number, body.type)
    pm = PaymentMethod(type=body.type, nickname=body.nickname, number=masked)
    db.add(pm)
    db.commit()
    db.refresh(pm)
    return pm


@router.put("/payment-methods/{pm_id}", response_model=PaymentMethodResponse)
def update_payment_method(pm_id: int, body: PaymentMethodUpdate, db: Session = Depends(get_db)):
    pm = db.get(PaymentMethod, pm_id)
    if not pm:
        raise HTTPException(status_code=404, detail="결제수단을 찾을 수 없습니다.")
    if body.nickname is not None:
        pm.nickname = body.nickname
    if body.is_active is not None:
        pm.is_active = body.is_active
    db.commit()
    db.refresh(pm)
    return pm


@router.delete("/payment-methods/{pm_id}", status_code=204)
def delete_payment_method(pm_id: int, db: Session = Depends(get_db)):
    pm = db.get(PaymentMethod, pm_id)
    if not pm:
        raise HTTPException(status_code=404, detail="결제수단을 찾을 수 없습니다.")
    db.delete(pm)
    db.commit()
