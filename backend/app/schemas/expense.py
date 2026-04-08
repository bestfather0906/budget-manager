from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, field_validator


class ExpenseCreate(BaseModel):
    budget_item_id: int
    expense_date: date
    amount: int
    description: str
    vendor: Optional[str] = None
    payment_method_id: Optional[int] = None
    withdrawal_date: Optional[date] = None

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
    budget_item_id: Optional[int] = None
    expense_date: Optional[date] = None
    amount: Optional[int] = None
    description: Optional[str] = None
    vendor: Optional[str] = None
    payment_method_id: Optional[int] = None
    withdrawal_date: Optional[date] = None


class ExpenseResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    project_id: int
    budget_item_id: int
    budget_item_name: str = ""
    sub_category_name: str = ""
    category_name: str = ""
    expense_date: date
    amount: int
    description: str
    vendor: Optional[str]
    payment_method_id: Optional[int] = None
    payment_method_nickname: Optional[str] = None
    payment_method_type: Optional[str] = None
    payment_method_number: Optional[str] = None
    withdrawal_date: Optional[date] = None
    created_at: datetime
    updated_at: datetime


class ExpenseListResponse(BaseModel):
    items: List[ExpenseResponse]
    total_count: int
    total_amount: int
