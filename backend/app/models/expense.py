from datetime import date, datetime
from typing import Optional

from sqlalchemy import BigInteger, Date, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Expense(Base):
    __tablename__ = "expenses"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), nullable=False)
    budget_item_id: Mapped[int] = mapped_column(ForeignKey("budget_items.id"), nullable=False)
    expense_date: Mapped[date] = mapped_column(Date, nullable=False)
    amount: Mapped[int] = mapped_column(BigInteger, nullable=False)
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    vendor: Mapped[Optional[str]] = mapped_column(String(200))
    payment_method_id: Mapped[Optional[int]] = mapped_column(ForeignKey("payment_methods.id"), nullable=True)
    withdrawal_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=func.now())
    updated_at: Mapped[datetime] = mapped_column(default=func.now(), onupdate=func.now())

    project: Mapped["Project"] = relationship("Project", back_populates="expenses")  # type: ignore[name-defined]
    budget_item: Mapped["BudgetItem"] = relationship("BudgetItem", back_populates="expenses")  # type: ignore[name-defined]
    payment_method: Mapped[Optional["PaymentMethod"]] = relationship("PaymentMethod", back_populates="expenses")  # type: ignore[name-defined]
