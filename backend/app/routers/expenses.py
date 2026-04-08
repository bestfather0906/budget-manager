from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import BudgetItem, Expense, Project
from app.schemas.expense import ExpenseCreate, ExpenseListResponse, ExpenseResponse, ExpenseUpdate

router = APIRouter(tags=["expenses"])


def _get_expense_or_404(expense_id: int, db: Session) -> Expense:
    expense = db.get(Expense, expense_id)
    if not expense:
        raise HTTPException(status_code=404, detail="지출내역을 찾을 수 없습니다.")
    return expense


def _to_response(expense: Expense) -> ExpenseResponse:
    pm = expense.payment_method
    item = expense.budget_item
    sub = item.sub_category if item else None
    cat = sub.category if sub else None
    return ExpenseResponse(
        id=expense.id,
        project_id=expense.project_id,
        budget_item_id=expense.budget_item_id,
        budget_item_name=item.name if item else "",
        sub_category_name=sub.name if sub else "",
        category_name=cat.name if cat else "",
        expense_date=expense.expense_date,
        amount=expense.amount,
        description=expense.description,
        vendor=expense.vendor,
        payment_method_id=pm.id if pm else None,
        payment_method_nickname=pm.nickname if pm else None,
        payment_method_type=pm.type if pm else None,
        payment_method_number=pm.number if pm else None,
        withdrawal_date=expense.withdrawal_date,
        created_at=expense.created_at,
        updated_at=expense.updated_at,
    )


@router.get("/projects/{project_id}/expenses", response_model=ExpenseListResponse)
def list_expenses(
    project_id: int,
    category_id: Optional[int] = None,
    sub_category_id: Optional[int] = None,
    budget_item_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="사업을 찾을 수 없습니다.")

    query = db.query(Expense).filter(Expense.project_id == project_id)

    if budget_item_id:
        query = query.filter(Expense.budget_item_id == budget_item_id)
    elif sub_category_id:
        items = db.query(BudgetItem).filter_by(sub_category_id=sub_category_id).all()
        item_ids = [i.id for i in items]
        query = query.filter(Expense.budget_item_id.in_(item_ids))
    elif category_id:
        from app.models import BudgetSubCategory
        subs = db.query(BudgetSubCategory).filter_by(category_id=category_id).all()
        sub_ids = [s.id for s in subs]
        items = db.query(BudgetItem).filter(BudgetItem.sub_category_id.in_(sub_ids)).all()
        item_ids = [i.id for i in items]
        query = query.filter(Expense.budget_item_id.in_(item_ids))

    if start_date:
        query = query.filter(Expense.expense_date >= start_date)
    if end_date:
        query = query.filter(Expense.expense_date <= end_date)

    expenses = query.order_by(Expense.expense_date.desc()).all()
    total_amount = sum(e.amount for e in expenses)

    return ExpenseListResponse(
        items=[_to_response(e) for e in expenses],
        total_count=len(expenses),
        total_amount=total_amount,
    )


@router.post("/projects/{project_id}/expenses", response_model=ExpenseResponse, status_code=201)
def create_expense(project_id: int, data: ExpenseCreate, db: Session = Depends(get_db)):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="사업을 찾을 수 없습니다.")

    item = db.get(BudgetItem, data.budget_item_id)
    if not item:
        raise HTTPException(status_code=400, detail="유효하지 않은 품목입니다.")

    expense = Expense(project_id=project_id, **data.model_dump())
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return _to_response(expense)


@router.put("/expenses/{expense_id}", response_model=ExpenseResponse)
def update_expense(expense_id: int, data: ExpenseUpdate, db: Session = Depends(get_db)):
    expense = _get_expense_or_404(expense_id, db)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(expense, field, value)
    db.commit()
    db.refresh(expense)
    return _to_response(expense)


@router.delete("/expenses/{expense_id}", status_code=204)
def delete_expense(expense_id: int, db: Session = Depends(get_db)):
    expense = _get_expense_or_404(expense_id, db)
    db.delete(expense)
    db.commit()
