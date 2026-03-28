# 사업예산 관리 시스템 SPEC

## 1. 프로젝트 개요

회사 내 진행 중인 사업(최대 3개)의 예산을 관리하는 웹 애플리케이션.
예산 편성, 지출 입력, 집행현황 조회, 월별 분석, 엑셀 다운로드 기능 제공.

## 2. 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | React + Vite + TailwindCSS + Recharts |
| Backend | Python + FastAPI + SQLAlchemy |
| Database | SQLite (개발) / PostgreSQL (프로덕션) |
| 인증 | 없음 (단독 사용) |
| 배포 | Docker + Railway |

## 3. 핵심 기능

### 3.1 사업 관리
- 사업 생성/수정/삭제 (최대 3개)
- 사업별 전체 예산 설정
- 사업별 비목(예산 항목) 등록 및 금액 배분

### 3.2 예산 집행현황 대시보드
- 전체 예산 대비 집행률 (진행바 + 퍼센트)
- 비목별 예산 / 집행액 / 잔액 / 집행률 표
- 잔액 = 예산 - 집행액

### 3.3 지출내역 관리
- 지출 입력 항목: 날짜, 금액, 내용(적요), 비목, 지출처, 사용카드번호
- 지출 목록 조회 (사업별 필터, 비목별 필터, 날짜 범위 필터)
- 지출 수정 / 삭제

### 3.4 월별 집행현황
- 월별 집행액 테이블 (사업별)
- 월별 집행액 막대차트 (Recharts)
- 비목별 월별 집행 추이 꺾은선 차트

### 3.5 엑셀 다운로드
- 지출내역 전체 다운로드 (.xlsx)
- 사업별 집행현황 요약 다운로드

## 4. 데이터 모델

### Project (사업)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INTEGER PK | |
| name | VARCHAR(100) | 사업명 |
| description | TEXT | 사업 설명 |
| total_budget | BIGINT | 전체 예산 (원) |
| start_date | DATE | 사업 시작일 |
| end_date | DATE | 사업 종료일 |
| created_at | DATETIME | |

### BudgetCategory (비목)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INTEGER PK | |
| project_id | INTEGER FK | |
| name | VARCHAR(100) | 비목명 (예: 인건비, 운영비) |
| allocated_amount | BIGINT | 배정 예산 |
| order_index | INTEGER | 표시 순서 |

### Expense (지출내역)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INTEGER PK | |
| project_id | INTEGER FK | |
| category_id | INTEGER FK | 비목 |
| expense_date | DATE | 지출일 |
| amount | BIGINT | 금액 (원) |
| description | VARCHAR(500) | 내용(적요) |
| vendor | VARCHAR(200) | 지출처 |
| card_number | VARCHAR(50) | 사용카드번호 (마스킹 저장) |
| created_at | DATETIME | |
| updated_at | DATETIME | |

## 5. API 설계

### 사업 API
| Method | URL | 설명 |
|--------|-----|------|
| GET | /api/v1/projects | 사업 목록 |
| POST | /api/v1/projects | 사업 생성 |
| GET | /api/v1/projects/{id} | 사업 상세 |
| PUT | /api/v1/projects/{id} | 사업 수정 |
| DELETE | /api/v1/projects/{id} | 사업 삭제 |
| GET | /api/v1/projects/{id}/summary | 집행현황 요약 |

### 비목 API
| Method | URL | 설명 |
|--------|-----|------|
| GET | /api/v1/projects/{id}/categories | 비목 목록 |
| POST | /api/v1/projects/{id}/categories | 비목 생성 |
| PUT | /api/v1/categories/{id} | 비목 수정 |
| DELETE | /api/v1/categories/{id} | 비목 삭제 |

### 지출 API
| Method | URL | 설명 |
|--------|-----|------|
| GET | /api/v1/projects/{id}/expenses | 지출 목록 (필터 포함) |
| POST | /api/v1/projects/{id}/expenses | 지출 입력 |
| PUT | /api/v1/expenses/{id} | 지출 수정 |
| DELETE | /api/v1/expenses/{id} | 지출 삭제 |
| GET | /api/v1/projects/{id}/monthly-stats | 월별 집행현황 |
| GET | /api/v1/projects/{id}/export | 엑셀 다운로드 |

### 기타
| Method | URL | 설명 |
|--------|-----|------|
| GET | /health | 헬스체크 |

## 6. Frontend 라우트

| 경로 | 페이지 | 설명 |
|------|--------|------|
| / | 대시보드 | 전체 사업 집행현황 요약 |
| /projects | 사업 목록 | 사업 카드 목록 |
| /projects/new | 사업 생성 | |
| /projects/:id | 사업 상세/대시보드 | 집행현황 + 비목별 현황 |
| /projects/:id/edit | 사업 수정 | |
| /projects/:id/categories | 비목 관리 | |
| /projects/:id/expenses | 지출내역 | 목록 + 필터 |
| /projects/:id/expenses/new | 지출 입력 | |
| /projects/:id/expenses/:eid/edit | 지출 수정 | |
| /projects/:id/monthly | 월별 집행현황 | 표 + 차트 |

## 7. 프로젝트 구조

```
사업예산 관리/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── models/
│   │   │   ├── project.py
│   │   │   ├── category.py
│   │   │   └── expense.py
│   │   ├── schemas/
│   │   │   ├── project.py
│   │   │   ├── category.py
│   │   │   └── expense.py
│   │   ├── routers/
│   │   │   ├── projects.py
│   │   │   ├── categories.py
│   │   │   └── expenses.py
│   │   └── services/
│   │       └── export.py
│   ├── alembic/
│   ├── tests/
│   ├── requirements.txt
│   └── alembic.ini
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/
│   │   └── types/
│   ├── package.json
│   └── vite.config.ts
├── scripts/
│   ├── install.sh
│   ├── dev.sh
│   └── test.sh
├── Dockerfile
├── railway.toml
├── SPEC.md
└── .env.example
```

## 8. 비즈니스 규칙

- 사업은 최대 3개까지 생성 가능
- 비목별 배정 예산 합계가 전체 예산을 초과하면 경고 표시 (초과 가능하되 경고)
- 지출 삭제 시 소프트 삭제 없이 즉시 삭제 (확인 다이얼로그 필수)
- 카드번호는 뒤 4자리만 표시 (예: ****-****-****-1234)
- 금액은 항상 원화(₩) 천단위 콤마 표시
- 집행률이 90% 이상이면 빨간색, 70~90%면 노란색, 70% 미만이면 녹색 표시

## 9. 엑셀 다운로드 스펙

### 지출내역 시트
- 컬럼: 번호, 날짜, 비목, 내용(적요), 지출처, 카드번호, 금액
- 비목별 소계 행 포함
- 합계 행 포함

### 집행현황 요약 시트
- 비목명, 배정예산, 집행액, 잔액, 집행률

## 10. 환경 변수

```
DATABASE_URL=sqlite:///./budget.db
ENVIRONMENT=development
PORT=8000
```

## 11. 디자인 원칙

- 심플하고 깔끔한 관리자 대시보드 스타일
- 주요 색상: 파란색 계열 (집행), 회색 (미집행), 빨간색 (초과/위험)
- 숫자는 모두 우측 정렬
- 테이블은 줄무늬 (stripe) 스타일

## 12. Testing Requirements

### 12.1 API Contract Tests (pytest)
| 엔드포인트 | 테스트 케이스 | 예상 상태코드 |
|-----------|-------------|-------------|
| GET /projects | 빈 목록 | 200 |
| POST /projects | 정상 생성 | 201 |
| POST /projects | 4번째 사업 생성 시도 | 400 |
| GET /projects/{id} | 존재하는 사업 | 200 |
| GET /projects/{id} | 존재하지 않는 사업 | 404 |
| POST /projects/{id}/categories | 비목 생성 | 201 |
| POST /projects/{id}/expenses | 지출 입력 | 201 |
| GET /projects/{id}/expenses | 지출 목록 | 200 |
| GET /projects/{id}/summary | 집행현황 요약 | 200 |
| GET /projects/{id}/monthly-stats | 월별 통계 | 200 |
| GET /health | 헬스체크 | 200 |

### 12.2 Component Render Tests (Vitest)
| 컴포넌트 | 테스트 케이스 |
|---------|-------------|
| Dashboard | 사업 요약 카드 렌더링 |
| ProjectDetail | 집행률 진행바 렌더링 |
| ExpenseForm | 입력 폼 필드 렌더링 |
| ExpenseList | 지출 목록 테이블 렌더링 |
| MonthlyChart | 차트 컨테이너 렌더링 |

### 12.3 타입 일관성
| API | 응답 타입 |
|-----|---------|
| GET /projects | ProjectSummary[] (집행액 포함) |
| GET /projects/{id} | ProjectDetail (categories 포함) |
| GET /projects/{id}/expenses | ExpenseList (items: Expense[]) |
| GET /projects/{id}/summary | BudgetSummary |
| GET /projects/{id}/monthly-stats | MonthlyStats[] |
