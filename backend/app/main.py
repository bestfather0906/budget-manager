from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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
