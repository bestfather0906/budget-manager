from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import BudgetItem, BudgetSubCategory
from app.schemas.category import BudgetItemCreate, BudgetItemResponse, BudgetItemUpdate

router = APIRouter(tags=["budget-items"])


def _get_item_or_404(item_id: int, db: Session) -> BudgetItem:
    item = db.get(BudgetItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="품목을 찾을 수 없습니다.")
    return item


@router.get("/sub-categories/{sub_category_id}/budget-items", response_model=List[BudgetItemResponse])
def list_budget_items(sub_category_id: int, db: Session = Depends(get_db)):
    sc = db.get(BudgetSubCategory, sub_category_id)
    if not sc:
        raise HTTPException(status_code=404, detail="세세목을 찾을 수 없습니다.")
    return db.query(BudgetItem).filter_by(sub_category_id=sub_category_id).all()


@router.post("/sub-categories/{sub_category_id}/budget-items", response_model=BudgetItemResponse, status_code=201)
def create_budget_item(sub_category_id: int, data: BudgetItemCreate, db: Session = Depends(get_db)):
    sc = db.get(BudgetSubCategory, sub_category_id)
    if not sc:
        raise HTTPException(status_code=404, detail="세세목을 찾을 수 없습니다.")
    item = BudgetItem(sub_category_id=sub_category_id, **data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/budget-items/{item_id}", response_model=BudgetItemResponse)
def update_budget_item(item_id: int, data: BudgetItemUpdate, db: Session = Depends(get_db)):
    item = _get_item_or_404(item_id, db)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/budget-items/{item_id}", status_code=204)
def delete_budget_item(item_id: int, db: Session = Depends(get_db)):
    item = _get_item_or_404(item_id, db)
    db.delete(item)
    db.commit()
