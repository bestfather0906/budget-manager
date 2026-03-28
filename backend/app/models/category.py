from typing import List

from sqlalchemy import BigInteger, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class BudgetCategory(Base):
    __tablename__ = "budget_categories"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    allocated_amount: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    order_index: Mapped[int] = mapped_column(default=0)

    project: Mapped["Project"] = relationship("Project", back_populates="categories")  # type: ignore[name-defined]
    expenses: Mapped[List["Expense"]] = relationship("Expense", back_populates="category")  # type: ignore[name-defined]
