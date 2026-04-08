from typing import List, Literal

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import BudgetCategory, BudgetItem, BudgetSubCategory, Expense, Project
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

    for cat in categories:
        # 세목 아래 모든 품목 ID 수집
        sub_ids = [s.id for s in db.query(BudgetSubCategory).filter_by(category_id=cat.id).all()]
        items = db.query(BudgetItem).filter(BudgetItem.sub_category_id.in_(sub_ids)).all() if sub_ids else []
        item_ids = [i.id for i in items]

        # 계획금액 = 품목별 단가 × 수량 합계
        planned = sum(i.unit_price * i.quantity for i in items)

        # 집행액
        spent = (
            db.query(func.sum(Expense.amount))
            .filter(Expense.budget_item_id.in_(item_ids))
            .scalar()
            or 0
        ) if item_ids else 0

        remaining = planned - spent
        rate = round(spent / planned * 100, 1) if planned > 0 else 0.0
        category_items.append(
            CategoryBudgetItem(
                category_id=cat.id,
                category_name=cat.name,
                allocated_amount=planned,
                spent_amount=spent,
                remaining=remaining,
                execution_rate=rate,
                status_color=_status_color(rate),
            )
        )

    total_planned = sum(item.allocated_amount for item in category_items)
    total_spent = sum(item.spent_amount for item in category_items)
    total_remaining = total_planned - total_spent
    overall_rate = round(total_spent / total_planned * 100, 1) if total_planned > 0 else 0.0

    return BudgetSummary(
        project_id=project.id,
        project_name=project.name,
        total_budget=project.total_budget,
        total_spent=total_spent,
        total_remaining=total_remaining,
        execution_rate=overall_rate,
        budget_warning=total_planned > project.total_budget,
        categories=category_items,
    )


def get_monthly_stats(db: Session, project_id: int) -> List[MonthlyStatItem]:
    """PostgreSQL: TO_CHAR(expense_date, 'YYYY-MM') 로 월별·세목별 집계"""
    results = (
        db.query(
            func.to_char(Expense.expense_date, "YYYY-MM").label("month"),
            BudgetCategory.name.label("category_name"),
            func.sum(Expense.amount).label("total_amount"),
        )
        .join(BudgetItem, Expense.budget_item_id == BudgetItem.id)
        .join(BudgetSubCategory, BudgetItem.sub_category_id == BudgetSubCategory.id)
        .join(BudgetCategory, BudgetSubCategory.category_id == BudgetCategory.id)
        .filter(Expense.project_id == project_id)
        .group_by(func.to_char(Expense.expense_date, "YYYY-MM"), BudgetCategory.name)
        .order_by(func.to_char(Expense.expense_date, "YYYY-MM"), BudgetCategory.name)
        .all()
    )

    return [
        MonthlyStatItem(month=row.month, category_name=row.category_name, total_amount=row.total_amount)
        for row in results
    ]
