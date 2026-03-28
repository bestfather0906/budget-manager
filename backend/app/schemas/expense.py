from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, field_validator


def _mask_card_number(v: str) -> str:
    digits = v.replace("-", "").replace(" ", "")
    if len(digits) >= 4:
        return f"****-****-****-{digits[-4:]}"
    return v


class ExpenseCreate(BaseModel):
    category_id: int
    expense_date: date
    amount: int
    description: str
    vendor: Optional[str] = None
    card_number: Optional[str] = None

    @field_validator("card_number", mode="before")
    @classmethod
    def mask_card(cls, v: Optional[str]) -> Optional[str]:
        if v and v.strip():
            return _mask_card_number(v.strip())
        return None

    @field_validator("amount")
    @classmethod
    def amount_positive(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("금액은 0보다 커야 합니다.")
        return v

    @field_validator("description")
    @classmethod
    def description_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("내용을 입력해주세요.")
        return v.strip()


class ExpenseUpdate(BaseModel):
    category_id: Optional[int] = None
    expense_date: Optional[date] = None
    amount: Optional[int] = None
    description: Optional[str] = None
    vendor: Optional[str] = None
    card_number: Optional[str] = None

    @field_validator("card_number", mode="before")
    @classmethod
    def mask_card(cls, v: Optional[str]) -> Optional[str]:
        if v and v.strip():
            return _mask_card_number(v.strip())
        return None


class ExpenseResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    project_id: int
    category_id: int
    category_name: str = ""
    expense_date: date
    amount: int
    description: str
    vendor: Optional[str]
    card_number: Optional[str]
    created_at: datetime
    updated_at: datetime


class ExpenseListResponse(BaseModel):
    items: List[ExpenseResponse]
    total_count: int
    total_amount: int
