from typing import List, Literal

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import BudgetCategory, Expense, Project
from app.schemas.project import BudgetSummary, CategoryBudgetItem, MonthlyStatItem


def _status_color(rate: float) -> Literal["green", "yellow", "red"]:
    if rate >= 90:
        return "red"
    if rate >= 70:
        return "yellow"
    return "green"


def get_project_summary(db: Session, project_id: int) -> BudgetSummary:
    project: Project = db.get(Project, project_id)

    categories = (
        db.query(BudgetCategory)
        .filter_by(project_id=project_id)
        .order_by(BudgetCategory.order_index)
        .all()
    )

    category_items: List[CategoryBudgetItem] = []
    total_allocated = sum(c.allocated_amount for c in categories)

    for cat in categories:
        spent = (
            db.query(func.sum(Expense.amount))
            .filter(Expense.category_id == cat.id)
            .scalar()
            or 0
        )
        remaining = cat.allocated_amount - spent
        rate = round(spent / cat.allocated_amount * 100, 1) if cat.allocated_amount > 0 else 0.0
        category_items.append(
            CategoryBudgetItem(
                category_id=cat.id,
                category_name=cat.name,
                allocated_amount=cat.allocated_amount,
                spent_amount=spent,
                remaining=remaining,
                execution_rate=rate,
                status_color=_status_color(rate),
            )
        )

    total_spent = sum(item.spent_amount for item in category_items)
    total_remaining = project.total_budget - total_spent
    overall_rate = (
        round(total_spent / project.total_budget * 100, 1) if project.total_budget > 0 else 0.0
    )
    budget_warning = total_allocated > project.total_budget

    return BudgetSummary(
        project_id=project.id,
        project_name=project.name,
        total_budget=project.total_budget,
        total_spent=total_spent,
        total_remaining=total_remaining,
        execution_rate=overall_rate,
        budget_warning=budget_warning,
        categories=category_items,
    )


def get_monthly_stats(db: Session, project_id: int) -> List[MonthlyStatItem]:
    """SQLite: strftime('%Y-%m', expense_date) 로 월별·비목별 집계"""
    results = (
        db.query(
            func.strftime("%Y-%m", Expense.expense_date).label("month"),
            BudgetCategory.name.label("category_name"),
            func.sum(Expense.amount).label("total_amount"),
        )
        .join(BudgetCategory, Expense.category_id == BudgetCategory.id)
        .filter(Expense.project_id == project_id)
        .group_by("month", "category_name")
        .order_by("month", "category_name")
        .all()
    )

    return [
        MonthlyStatItem(month=row.month, category_name=row.category_name, total_amount=row.total_amount)
        for row in results
    ]
