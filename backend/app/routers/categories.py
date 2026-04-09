from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models import BudgetCategory, Project
from app.models.category import BudgetSubCategory
from app.schemas.category import CategoryCreate, CategoryResponse, CategoryUpdate, CategoryWithTree

router = APIRouter(tags=["categories"])


def _get_category_or_404(category_id: int, db: Session) -> BudgetCategory:
    cat = db.get(BudgetCategory, category_id)
    if not cat:
        raise HTTPException(status_code=404, detail="세목을 찾을 수 없습니다.")
    return cat


@router.get("/projects/{project_id}/categories", response_model=List[CategoryResponse])
def list_categories(project_id: int, db: Session = Depends(get_db)):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="사업을 찾을 수 없습니다.")
    return db.query(BudgetCategory).filter_by(project_id=project_id).order_by(BudgetCategory.order_index).all()


@router.get("/projects/{project_id}/budget-tree", response_model=List[CategoryWithTree])
def get_budget_tree(project_id: int, db: Session = Depends(get_db)):
    """세목→세세목→품목 전체 계층 조회"""
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="사업을 찾을 수 없습니다.")
    return (
        db.query(BudgetCategory)
        .filter_by(project_id=project_id)
        .options(
            selectinload(BudgetCategory.sub_categories).selectinload(
                BudgetSubCategory.budget_items
            )
        )
        .order_by(BudgetCategory.order_index)
        .all()
    )


@router.post("/projects/{project_id}/categories", response_model=CategoryResponse, status_code=201)
def create_category(project_id: int, data: CategoryCreate, db: Session = Depends(get_db)):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="사업을 찾을 수 없습니다.")
    category = BudgetCategory(project_id=project_id, **data.model_dump())
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.put("/categories/{category_id}", response_model=CategoryResponse)
def update_category(category_id: int, data: CategoryUpdate, db: Session = Depends(get_db)):
    cat = _get_category_or_404(category_id, db)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(cat, field, value)
    db.commit()
    db.refresh(cat)
    return cat


@router.delete("/categories/{category_id}", status_code=204)
def delete_category(category_id: int, db: Session = Depends(get_db)):
    cat = _get_category_or_404(category_id, db)
    db.delete(cat)
    db.commit()
