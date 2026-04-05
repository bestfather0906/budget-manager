from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from app.routers import categories, expenses, payment_methods, projects

app = FastAPI(title="사업예산 관리 API", version="1.0.0")
app.router.redirect_slashes = False

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects.router, prefix="/api/v1")
app.include_router(categories.router, prefix="/api/v1")
app.include_router(expenses.router, prefix="/api/v1")
app.include_router(payment_methods.router, prefix="/api/v1")


@app.get("/health")
def health():
    return {"status": "ok"}


# 프로덕션: 빌드된 프론트엔드 정적 파일 서빙 (SPA 라우팅 지원)
_frontend_dist = Path(__file__).parent.parent.parent / "frontend" / "dist"


@app.get("/{full_path:path}", include_in_schema=False)
async def serve_spa(full_path: str):
    if not _frontend_dist.exists():
        return {"detail": "Frontend not built"}
    file_path = (_frontend_dist / full_path).resolve()
    # 실제 파일이 있으면 그대로 반환 (JS, CSS, 이미지 등)
    if file_path.is_relative_to(_frontend_dist.resolve()) and file_path.is_file():
        return FileResponse(str(file_path))
    # 없으면 index.html 반환 (React Router가 클라이언트에서 처리)
    return FileResponse(str(_frontend_dist / "index.html"))
