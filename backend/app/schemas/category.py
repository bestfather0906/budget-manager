from typing import Optional

from pydantic import BaseModel, field_validator


class CategoryCreate(BaseModel):
    name: str
    allocated_amount: int = 0
    order_index: int = 0

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("비목명을 입력해주세요.")
        return v.strip()

    @field_validator("allocated_amount")
    @classmethod
    def amount_non_negative(cls, v: int) -> int:
        if v < 0:
            raise ValueError("배정 예산은 0 이상이어야 합니다.")
        return v


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    allocated_amount: Optional[int] = None
    order_index: Optional[int] = None


class CategoryResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    project_id: int
    name: str
    allocated_amount: int
    order_index: int
