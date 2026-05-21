import os
from typing import Any

from google import genai
from sqlalchemy import text
from sqlalchemy.orm import Session


def _is_ai_enabled() -> bool:
    return os.getenv("AI_CHAT_ENABLED", "true").lower() == "true"


def _get_gemini_client():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return None

    return genai.Client(api_key=api_key)


def collect_business_context(
    db: Session,
    department: str = "all",
    subdepartment: str = "all",
) -> dict[str, Any]:
    """
    Собирает безопасный контекст из БД.
    Модель НЕ получает доступ к базе и НЕ выполняет SQL.
    """

    department_filter = ""
    params: dict[str, Any] = {}

    if department and department != "all":
        department_filter = "AND d.name = :department"
        params["department"] = department

    sales_rows = db.execute(
        text(
            f"""
            SELECT
                d.name AS department_name,
                p.sku,
                p.name AS product_name,
                pv.full_sku,
                SUM(sh.quantity - sh.return_quantity) AS sold_qty,
                MAX(sh.sale_date) AS last_sale_date
            FROM sales_history sh
            JOIN product_variants pv ON pv.id = sh.variant_id
            JOIN products p ON p.id = pv.product_id
            JOIN departments d ON d.id = p.department_id
            WHERE sh.sale_date >= DATE '2026-04-27'
              AND sh.sale_date <= DATE '2026-05-03'
              {department_filter}
            GROUP BY d.name, p.sku, p.name, pv.full_sku
            ORDER BY sold_qty DESC
            LIMIT 10
            """
        ),
        params,
    ).mappings().all()

    stock_rows = db.execute(
        text(
            f"""
            SELECT
                d.name AS department_name,
                p.sku,
                p.name AS product_name,
                pv.full_sku,
                pv.current_stock,
                pv.reserved_stock,
                pv.safety_stock,
                pv.current_stock - pv.reserved_stock AS available_stock
            FROM product_variants pv
            JOIN products p ON p.id = pv.product_id
            JOIN departments d ON d.id = p.department_id
            WHERE p.is_active = true
              {department_filter}
            ORDER BY available_stock ASC
            LIMIT 10
            """
        ),
        params,
    ).mappings().all()

    recommendation_rows = db.execute(
        text(
            f"""
            SELECT
                d.name AS department_name,
                p.sku,
                p.name AS product_name,
                pv.full_sku,
                ar.recommendation_type,
                ar.priority,
                ar.suggested_quantity,
                ar.reason
            FROM ai_recommendations ar
            JOIN products p ON p.id = ar.product_id
            LEFT JOIN product_variants pv ON pv.id = ar.variant_id
            JOIN departments d ON d.id = p.department_id
            WHERE ar.status = 'new'
              {department_filter}
            ORDER BY
                CASE ar.priority
                    WHEN 'critical' THEN 1
                    WHEN 'high' THEN 2
                    WHEN 'medium' THEN 3
                    WHEN 'low' THEN 4
                    ELSE 5
                END,
                ar.recommendation_date DESC
            LIMIT 10
            """
        ),
        params,
    ).mappings().all()

    operation_rows = db.execute(
        text(
            f"""
            SELECT
                d.name AS department_name,
                ol.operation_type,
                ol.quantity,
                ol.comment,
                ol.created_at
            FROM operation_log ol
            LEFT JOIN departments d ON d.id = ol.department_id
            WHERE ol.created_at >= TIMESTAMP '2026-04-27 00:00:00'
              AND ol.created_at <= TIMESTAMP '2026-05-03 23:59:59'
              {department_filter}
            ORDER BY ol.created_at DESC
            LIMIT 10
            """
        ),
        params,
    ).mappings().all()

    return {
        "period": "27.04.2026–03.05.2026",
        "department": department,
        "subdepartment": subdepartment,
        "top_sales": [dict(row) for row in sales_rows],
        "low_stock": [dict(row) for row in stock_rows],
        "recommendations": [dict(row) for row in recommendation_rows],
        "recent_operations": [dict(row) for row in operation_rows],
    }


def build_demo_answer(message: str, context: dict[str, Any]) -> str:
    top_sales = context.get("top_sales", [])
    low_stock = context.get("low_stock", [])
    recommendations = context.get("recommendations", [])

    lines = [
        "Я проанализировал данные системы в демонстрационном режиме.",
        "",
    ]

    if top_sales:
        item = top_sales[0]
        lines.append(
            f"Самая активная позиция по продажам: {item.get('product_name')} "
            f"({item.get('full_sku')}), продано {item.get('sold_qty')} шт."
        )

    if low_stock:
        item = low_stock[0]
        lines.append(
            f"Наименьший доступный остаток: {item.get('product_name')} "
            f"({item.get('full_sku')}), доступно {item.get('available_stock')} шт."
        )

    if recommendations:
        item = recommendations[0]
        lines.append(
            f"Главная рекомендация: {item.get('reason')}"
        )

    lines.append("")
    lines.append(
        "Рекомендуется проверить товары с низким остатком, усилить выкладку ходовых позиций "
        "и включить дефицитные варианты в ближайшее пополнение или поставку."
    )

    return "\n".join(lines)


def ask_ai_about_database(
    db: Session,
    message: str,
    department: str = "all",
    subdepartment: str = "all",
) -> dict[str, str]:
    context = collect_business_context(db, department, subdepartment)

    if not _is_ai_enabled():
        return {
            "answer": build_demo_answer(message, context),
            "mode": "demo",
        }

    client = _get_gemini_client()

    if client is None:
        return {
            "answer": build_demo_answer(message, context),
            "mode": "demo_no_key",
        }

    model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

    prompt = f"""
Ты — AI-помощник корпоративной информационной системы складского учета и аналитики магазина одежды.

Твоя задача:
- отвечать сотруднику простым русским языком;
- анализировать только переданные данные;
- не придумывать факты, которых нет в контексте;
- давать практические рекомендации: что пополнить, что заказать, что проверить, что лучше вынести в торговый зал;
- если данных недостаточно, честно написать, каких данных не хватает.

Вопрос пользователя:
{message}

Контекст из базы данных:
{context}

Ответь структурированно:
1. Краткий вывод.
2. Что важно заметить.
3. Что сделать сотруднику.
"""

    try:
        response = client.models.generate_content(
            model=model_name,
            contents=prompt,
        )

        answer = getattr(response, "text", None) or "Не удалось получить текстовый ответ от AI."

        return {
            "answer": answer,
            "mode": "ai",
        }

    except Exception as exc:
        print(f"[AI CHAT ERROR] {exc}")

        return {
            "answer": build_demo_answer(message, context),
            "mode": "fallback",
        }