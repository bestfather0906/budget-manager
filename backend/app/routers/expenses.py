from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import BudgetCategory, Expense, Project
from app.schemas.expense import ExpenseCreate, ExpenseListResponse, ExpenseResponse, ExpenseUpdate

router = APIRouter(tags=["expenses"])


def _get_expense_or_404(expense_id: int, db: Session) -> Expense:
    expense = db.get(Expense, expense_id)
    if not expense:
        raise HTTPException(status_code=404, detail="지출내역을 찾을 수 없습니다.")
    return expense


def _to_response(expense: Expense) -> ExpenseResponse:
    pm = expense.payment_method
    return ExpenseResponse(
        id=expense.id,
        project_id=expense.project_id,
        category_id=expense.category_id,
        category_name=expense.category.name if expense.category else "",
        expense_date=expense.expense_date,
        amount=expense.amount,
        description=expense.description,
        vendor=expense.vendor,
        card_number=expense.card_number,
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
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="사업을 찾을 수 없습니다.")

    query = db.query(Expense).filter(Expense.project_id == project_id)
    if category_id:
        query = query.filter(Expense.category_id == category_id)
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

    category = db.get(BudgetCategory, data.category_id)
    if not category or category.project_id != project_id:
        raise HTTPException(status_code=400, detail="유효하지 않은 비목입니다.")

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
