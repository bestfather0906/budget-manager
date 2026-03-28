from datetime import date, datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, field_validator


class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    total_budget: int
    start_date: Optional[date] = None
    end_date: Optional[date] = None

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("사업명을 입력해주세요.")
        return v.strip()

    @field_validator("total_budget")
    @classmethod
    def budget_positive(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("예산은 0보다 커야 합니다.")
        return v


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    total_budget: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class ProjectResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    name: str
    description: Optional[str]
    total_budget: int
    start_date: Optional[date]
    end_date: Optional[date]
    created_at: datetime


class CategoryBudgetItem(BaseModel):
    category_id: int
    category_name: str
    allocated_amount: int
    spent_amount: int
    remaining: int
    execution_rate: float
    status_color: Literal["green", "yellow", "red"]


class BudgetSummary(BaseModel):
    project_id: int
    project_name: str
    total_budget: int
    total_spent: int
    total_remaining: int
    execution_rate: float
    budget_warning: bool
    categories: List[CategoryBudgetItem]


class MonthlyStatItem(BaseModel):
    month: str
    category_name: str
    total_amount: int


class ProjectSummaryResponse(BaseModel):
    """대시보드용 - 집행액 포함 요약"""
    model_config = {"from_attributes": True}

    id: int
    name: str
    description: Optional[str]
    total_budget: int
    start_date: Optional[date]
    end_date: Optional[date]
    total_spent: int = 0
    execution_rate: float = 0.0
    status_color: Literal["green", "yellow", "red"] = "green"
