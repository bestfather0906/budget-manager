from typing import List
from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Expense, Project
from app.schemas.project import (
    BudgetSummary,
    MonthlyStatItem,
    ProjectCreate,
    ProjectResponse,
    ProjectSummaryResponse,
    ProjectUpdate,
)
from app.services import budget as budget_service
from app.services import export as export_service

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


@router.get("/{project_id}/summary", response_model=BudgetSummary)
def project_summary(project_id: int, db: Session = Depends(get_db)):
    _get_project_or_404(project_id, db)
    return budget_service.get_project_summary(db, project_id)


@router.get("/{project_id}/monthly-stats", response_model=List[MonthlyStatItem])
def monthly_stats(project_id: int, db: Session = Depends(get_db)):
    _get_project_or_404(project_id, db)
    return budget_service.get_monthly_stats(db, project_id)


@router.get("/{project_id}/export")
def export_excel(project_id: int, db: Session = Depends(get_db)):
    project = _get_project_or_404(project_id, db)
    from datetime import date

    today = date.today().strftime("%Y%m%d")
    filename = f"사업예산_{project.name}_{today}.xlsx"
    content = export_service.generate_expense_excel(db, project_id)
    return Response(
        content=content,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{quote(filename)}"},
    )
