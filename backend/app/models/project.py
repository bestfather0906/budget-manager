from datetime import date, datetime
from typing import List, Optional

from sqlalchemy import BigInteger, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    total_budget: Mapped[int] = mapped_column(BigInteger, nullable=False)
    start_date: Mapped[Optional[date]]
    end_date: Mapped[Optional[date]]
    created_at: Mapped[datetime] = mapped_column(default=func.now())

    categories: Mapped[List["BudgetCategory"]] = relationship(  # type: ignore[name-defined]
        "BudgetCategory", back_populates="project", cascade="all, delete-orphan", order_by="BudgetCategory.order_index"
    )
    expenses: Mapped[List["Expense"]] = relationship(  # type: ignore[name-defined]
        "Expense", back_populates="project", cascade="all, delete-orphan"
    )
