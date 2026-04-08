from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.routers import budget_items, categories, expenses, payment_methods, projects, sub_categories

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
app.include_router(sub_categories.router, prefix="/api/v1")
app.include_router(budget_items.router, prefix="/api/v1")
app.include_router(expenses.router, prefix="/api/v1")
app.include_router(payment_methods.router, prefix="/api/v1")


@app.get("/health")
def health():
    return {"status": "ok"}


# 정적 파일 서빙 (프론트엔드 빌드 결과물: api/static/)
_static_dir = Path(__file__).parent.parent.parent / "api" / "static"

if _static_dir.exists():
    app.mount("/assets", StaticFiles(directory=str(_static_dir / "assets")), name="assets")

    @app.get("/", include_in_schema=False)
    async def serve_index():
        return FileResponse(str(_static_dir / "index.html"))

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        file_path = (_static_dir / full_path).resolve()
        if file_path.is_relative_to(_static_dir.resolve()) and file_path.is_file():
            return FileResponse(str(file_path))
        return FileResponse(str(_static_dir / "index.html"))
