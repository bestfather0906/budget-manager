from typing import List

from sqlalchemy import BigInteger, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class BudgetCategory(Base):
    """세목 — 예산의 최상위 분류 (예: 청소년단 운영비)"""
    __tablename__ = "budget_categories"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, default=0)

    project: Mapped["Project"] = relationship("Project", back_populates="categories")  # type: ignore[name-defined]
    sub_categories: Mapped[List["BudgetSubCategory"]] = relationship(
        "BudgetSubCategory", back_populates="category", cascade="all, delete-orphan"
    )


class BudgetSubCategory(Base):
    """세세목 — 세목 아래 중간 분류 (예: 위촉식 및 사전교육)"""
    __tablename__ = "budget_sub_categories"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("budget_categories.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, default=0)

    category: Mapped["BudgetCategory"] = relationship("BudgetCategory", back_populates="sub_categories")
    budget_items: Mapped[List["BudgetItem"]] = relationship(
        "BudgetItem", back_populates="sub_category", cascade="all, delete-orphan"
    )


class BudgetItem(Base):
    """품목 — 세세목 아래 실제 예산 항목 (예: 급식비, 단가 × 수량 = 계획금액)"""
    __tablename__ = "budget_items"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    sub_category_id: Mapped[int] = mapped_column(ForeignKey("budget_sub_categories.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    unit_price: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    note: Mapped[str] = mapped_column(String(200), nullable=True)

    sub_category: Mapped["BudgetSubCategory"] = relationship("BudgetSubCategory", back_populates="budget_items")
    expenses: Mapped[List["Expense"]] = relationship("Expense", back_populates="budget_item")  # type: ignore[name-defined]

    @property
    def planned_amount(self) -> int:
        return self.unit_price * self.quantity
