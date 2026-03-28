from datetime import date
from io import BytesIO

from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter
from sqlalchemy.orm import Session

from app.models import Expense, Project
from app.services.budget import get_project_summary


def generate_expense_excel(db: Session, project_id: int) -> bytes:
    project: Project = db.get(Project, project_id)
    summary = get_project_summary(db, project_id)

    wb = Workbook()

    # ── 시트1: 지출내역 ────────────────────────────────────────
    ws1 = wb.active
    ws1.title = "지출내역"

    header_fill = PatternFill(start_color="F97316", end_color="F97316", fill_type="solid")
    header_font = Font(bold=True, color="FFFFFF")
    subtotal_fill = PatternFill(start_color="FED7AA", end_color="FED7AA", fill_type="solid")
    total_fill = PatternFill(start_color="EA580C", end_color="EA580C", fill_type="solid")
    total_font = Font(bold=True, color="FFFFFF")
    even_fill = PatternFill(start_color="FFF7ED", end_color="FFF7ED", fill_type="solid")

    headers = ["번호", "날짜", "비목", "내용(적요)", "지출처", "카드번호", "금액"]
    col_widths = [6, 14, 14, 30, 20, 22, 16]

    for col, (header, width) in enumerate(zip(headers, col_widths), start=1):
        cell = ws1.cell(row=1, column=col, value=header)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center")
        ws1.column_dimensions[get_column_letter(col)].width = width

    expenses = (
        db.query(Expense)
        .filter(Expense.project_id == project_id)
        .order_by(Expense.category_id, Expense.expense_date)
        .all()
    )

    row = 2
    seq = 1
    current_category_id = None
    category_subtotal = 0
    category_name = ""

    def write_subtotal(ws, row: int, name: str, amount: int):
        ws.cell(row=row, column=1, value=f"[{name} 소계]").font = Font(bold=True)
        ws.cell(row=row, column=7, value=amount).number_format = "#,##0"
        ws.cell(row=row, column=7).alignment = Alignment(horizontal="right")
        for col in range(1, 8):
            ws.cell(row=row, column=col).fill = subtotal_fill

    grand_total = 0

    for expense in expenses:
        if expense.category_id != current_category_id:
            if current_category_id is not None:
                write_subtotal(ws1, row, category_name, category_subtotal)
                row += 1
            current_category_id = expense.category_id
            category_name = expense.category.name
            category_subtotal = 0

        is_even = (seq % 2 == 0)
        values = [
            seq,
            expense.expense_date.strftime("%Y-%m-%d") if isinstance(expense.expense_date, date) else str(expense.expense_date),
            expense.category.name,
            expense.description,
            expense.vendor or "",
            expense.card_number or "",
            expense.amount,
        ]
        for col, val in enumerate(values, start=1):
            cell = ws1.cell(row=row, column=col, value=val)
            if is_even:
                cell.fill = even_fill
            if col == 7:
                cell.number_format = "#,##0"
                cell.alignment = Alignment(horizontal="right")

        category_subtotal += expense.amount
        grand_total += expense.amount
        seq += 1
        row += 1

    if current_category_id is not None:
        write_subtotal(ws1, row, category_name, category_subtotal)
        row += 1

    # 합계 행
    total_cell = ws1.cell(row=row, column=1, value="합  계")
    total_cell.font = total_font
    total_cell.fill = total_fill
    amount_cell = ws1.cell(row=row, column=7, value=grand_total)
    amount_cell.number_format = "#,##0"
    amount_cell.alignment = Alignment(horizontal="right")
    amount_cell.font = total_font
    amount_cell.fill = total_fill
    for col in range(2, 7):
        ws1.cell(row=row, column=col).fill = total_fill

    # ── 시트2: 집행현황 요약 ───────────────────────────────────
    ws2 = wb.create_sheet("집행현황 요약")

    ws2.cell(row=1, column=1, value=f"사업명: {project.name}").font = Font(bold=True, size=13)
    ws2.cell(row=2, column=1, value="전체예산: ").font = Font(bold=True)
    ws2.cell(row=2, column=2, value=project.total_budget).number_format = "#,##0"

    headers2 = ["비목명", "배정예산", "집행액", "잔액", "집행률(%)"]
    col_widths2 = [20, 18, 18, 18, 14]
    for col, (header, width) in enumerate(zip(headers2, col_widths2), start=1):
        cell = ws2.cell(row=4, column=col, value=header)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center")
        ws2.column_dimensions[get_column_letter(col)].width = width

    for i, cat in enumerate(summary.categories, start=5):
        ws2.cell(row=i, column=1, value=cat.category_name)
        ws2.cell(row=i, column=2, value=cat.allocated_amount).number_format = "#,##0"
        ws2.cell(row=i, column=3, value=cat.spent_amount).number_format = "#,##0"
        ws2.cell(row=i, column=4, value=cat.remaining).number_format = "#,##0"
        rate_cell = ws2.cell(row=i, column=5, value=round(cat.execution_rate, 1))
        rate_cell.number_format = "0.0"
        rate_cell.alignment = Alignment(horizontal="right")
        if cat.execution_rate >= 90:
            for col in range(1, 6):
                ws2.cell(row=i, column=col).fill = PatternFill(
                    start_color="FECACA", end_color="FECACA", fill_type="solid"
                )

    summary_row = 5 + len(summary.categories)
    ws2.cell(row=summary_row, column=1, value="합  계").font = total_font
    ws2.cell(row=summary_row, column=2, value=sum(c.allocated_amount for c in summary.categories)).number_format = "#,##0"
    ws2.cell(row=summary_row, column=3, value=summary.total_spent).number_format = "#,##0"
    ws2.cell(row=summary_row, column=4, value=summary.total_remaining).number_format = "#,##0"
    ws2.cell(row=summary_row, column=5, value=round(summary.execution_rate, 1)).number_format = "0.0"
    for col in range(1, 6):
        ws2.cell(row=summary_row, column=col).fill = total_fill
        ws2.cell(row=summary_row, column=col).font = total_font

    buf = BytesIO()
    wb.save(buf)
    return buf.getvalue()
