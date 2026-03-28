from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Expense, Project
from app.schemas.project import (
    ProjectCreate,
    ProjectResponse,
    ProjectSummaryResponse,
    ProjectUpdate,
)

router = APIRouter(prefix="/projects", tags=["projects"])


def _get_project_or_404(project_id: int, db: Session) -> Project:
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="사업을 찾을 수 없습니다.")
    return project


@router.get("", response_model=List[ProjectSummaryResponse])
def list_projects(db: Session = Depends(get_db)):
    projects = db.query(Project).order_by(Project.created_at).all()
    result = []
    for p in projects:
        spent = db.query(func.sum(Expense.amount)).filter(Expense.project_id == p.id).scalar() or 0
        rate = round(spent / p.total_budget * 100, 1) if p.total_budget > 0 else 0.0
        color = "red" if rate >= 90 else ("yellow" if rate >= 70 else "green")
        result.append(
            ProjectSummaryResponse(
                id=p.id,
                name=p.name,
                description=p.description,
                total_budget=p.total_budget,
                start_date=p.start_date,
                end_date=p.end_date,
                total_spent=spent,
                execution_rate=rate,
                status_color=color,
            )
        )
    return result


@router.post("", response_model=ProjectResponse, status_code=201)
def create_project(data: ProjectCreate, db: Session = Depends(get_db)):
    count = db.query(func.count(Project.id)).scalar()
    if count >= 3:
        raise HTTPException(status_code=400, detail="사업은 최대 3개까지 생성 가능합니다.")
    project = Project(**data.model_dump())
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: int, db: Session = Depends(get_db)):
    return _get_project_or_404(project_id, db)


@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(project_id: int, data: ProjectUpdate, db: Session = Depends(get_db)):
    project = _get_project_or_404(project_id, db)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(project, field, value)
    db.commit()
    db.refresh(project)
    return project


@router.delete("/{project_id}", status_code=204)
def delete_project(project_id: int, db: Session = Depends(get_db)):
    project = _get_project_or_404(project_id, db)
    db.delete(project)
    db.commit()
