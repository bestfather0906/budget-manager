from typing import List, Optional

from pydantic import BaseModel, field_validator


# ── 세목 (BudgetCategory) ──────────────────────────────────────

class CategoryCreate(BaseModel):
    name: str
    order_index: int = 0

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("세목명을 입력해주세요.")
        return v.strip()


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    order_index: Optional[int] = None


class CategoryResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    project_id: int
    name: str
    order_index: int


# ── 세세목 (BudgetSubCategory) ────────────────────────────────

class SubCategoryCreate(BaseModel):
    name: str
    order_index: int = 0

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("세세목명을 입력해주세요.")
        return v.strip()


class SubCategoryUpdate(BaseModel):
    name: Optional[str] = None
    order_index: Optional[int] = None


class SubCategoryResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    category_id: int
    name: str
    order_index: int


# ── 품목 (BudgetItem) ─────────────────────────────────────────

class BudgetItemCreate(BaseModel):
    name: str
    unit_price: int = 0
    quantity: int = 1
    note: Optional[str] = None

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("품목명을 입력해주세요.")
        return v.strip()

    @field_validator("unit_price")
    @classmethod
    def unit_price_non_negative(cls, v: int) -> int:
        if v < 0:
            raise ValueError("단가는 0 이상이어야 합니다.")
        return v

    @field_validator("quantity")
    @classmethod
    def quantity_positive(cls, v: int) -> int:
        if v < 1:
            raise ValueError("수량은 1 이상이어야 합니다.")
        return v


class BudgetItemUpdate(BaseModel):
    name: Optional[str] = None
    unit_price: Optional[int] = None
    quantity: Optional[int] = None
    note: Optional[str] = None


class BudgetItemResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    sub_category_id: int
    name: str
    unit_price: int
    quantity: int
    note: Optional[str]
    planned_amount: int


# ── 계층 전체 조회용 ──────────────────────────────────────────

class SubCategoryWithItems(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    category_id: int
    name: str
    order_index: int
    budget_items: List[BudgetItemResponse]


class CategoryWithTree(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    project_id: int
    name: str
    order_index: int
    sub_categories: List[SubCategoryWithItems]
