from datetime import datetime
from typing import List, Literal, Optional, Union

from pydantic import BaseModel, field_validator


def _mask_number(v: str, type_: str) -> str:
    digits = v.replace("-", "").replace(" ", "")
    if type_ in ("credit", "debit") and len(digits) >= 4:
        return f"****-****-****-{digits[-4:]}"
    if type_ == "account" and len(digits) >= 4:
        return f"***-{digits[-4:]}"
    return v


class PaymentMethodCreate(BaseModel):
    type: Union[Literal["credit"], Literal["debit"], Literal["account"]]
    nickname: str
    number: str

    @field_validator("nickname")
    @classmethod
    def nickname_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("별칭을 입력해주세요.")
        return v.strip()

    @field_validator("number")
    @classmethod
    def number_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("번호를 입력해주세요.")
        return v.strip()


class PaymentMethodUpdate(BaseModel):
    nickname: Optional[str] = None
    is_active: Optional[bool] = None

    @field_validator("nickname")
    @classmethod
    def nickname_not_empty(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not v.strip():
            raise ValueError("별칭을 입력해주세요.")
        return v.strip() if v else v


class PaymentMethodResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    type: str
    nickname: str
    number: str
    is_active: bool
    created_at: datetime


class PaymentMethodListResponse(BaseModel):
    items: List[PaymentMethodResponse]
    total_count: int
