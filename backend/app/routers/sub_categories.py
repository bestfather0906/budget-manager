from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import BudgetCategory, BudgetSubCategory
from app.schemas.category import SubCategoryCreate, SubCategoryResponse, SubCategoryUpdate

router = APIRouter(tags=["sub-categories"])


def _get_sub_category_or_404(sub_category_id: int, db: Session) -> BudgetSubCategory:
    sc = db.get(BudgetSubCategory, sub_category_id)
    if not sc:
        raise HTTPException(status_code=404, detail="세세목을 찾을 수 없습니다.")
    return sc


@router.get("/categories/{category_id}/sub-categories", response_model=List[SubCategoryResponse])
def list_sub_categories(category_id: int, db: Session = Depends(get_db)):
    cat = db.get(BudgetCategory, category_id)
    if not cat:
        raise HTTPException(status_code=404, detail="세목을 찾을 수 없습니다.")
    return (
        db.query(BudgetSubCategory)
        .filter_by(category_id=category_id)
        .order_by(BudgetSubCategory.order_index)
        .all()
    )


@router.post("/categories/{category_id}/sub-categories", response_model=SubCategoryResponse, status_code=201)
def create_sub_category(category_id: int, data: SubCategoryCreate, db: Session = Depends(get_db)):
    cat = db.get(BudgetCategory, category_id)
    if not cat:
        raise HTTPException(status_code=404, detail="세목을 찾을 수 없습니다.")
    sc = BudgetSubCategory(category_id=category_id, **data.model_dump())
    db.add(sc)
    db.commit()
    db.refresh(sc)
    return sc


@router.put("/sub-categories/{sub_category_id}", response_model=SubCategoryResponse)
def update_sub_category(sub_category_id: int, data: SubCategoryUpdate, db: Session = Depends(get_db)):
    sc = _get_sub_category_or_404(sub_category_id, db)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(sc, field, value)
    db.commit()
    db.refresh(sc)
    return sc


@router.delete("/sub-categories/{sub_category_id}", status_code=204)
def delete_sub_category(sub_category_id: int, db: Session = Depends(get_db)):
    sc = _get_sub_category_or_404(sub_category_id, db)
    db.delete(sc)
    db.commit()
