from datetime import datetime, timedelta

from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload

from app.ai_service import generate_ai_recommendation_explanation

from app import models

def get_dashboard_summary(
    db: Session,
    department: str | None = None,
    subdepartment: str | None = None,
):
    normalized_department = (department or "").strip().lower()
    normalized_subdepartment = (subdepartment or "").strip().lower()

    department_values = None

    if normalized_department and normalized_department != "all":
        if normalized_department == "мужской":
            department_values = ["men"]
        elif normalized_department == "женский":
            department_values = ["woman"]
        elif normalized_department == "детский":
            if normalized_subdepartment == "девочки":
                department_values = ["girls"]
            elif normalized_subdepartment == "мальчики":
                department_values = ["boys"]
            elif normalized_subdepartment == "малыши":
                department_values = ["baby"]
            else:
                department_values = ["girls", "boys", "baby"]
        else:
            department_values = [normalized_department]

    products_query = db.query(models.Product)
    variants_query = db.query(models.ProductVariant).join(
        models.Product, models.ProductVariant.product_id == models.Product.id
    )
    low_stock_query = db.query(models.ProductVariant).join(
        models.Product, models.ProductVariant.product_id == models.Product.id
    )
    recommendations_query = db.query(models.AIRecommendation).join(
        models.Product, models.AIRecommendation.product_id == models.Product.id
    )
    anomalies_query = (
        db.query(models.AnomalyLog)
        .join(models.ProductVariant, models.AnomalyLog.variant_id == models.ProductVariant.id)
        .join(models.Product, models.ProductVariant.product_id == models.Product.id)
    )

    if department_values:
        products_query = (
            products_query
            .join(models.Department, models.Product.department_id == models.Department.id)
            .filter(func.lower(models.Department.name).in_(department_values))
        )

        variants_query = (
            variants_query
            .join(models.Department, models.Product.department_id == models.Department.id)
            .filter(func.lower(models.Department.name).in_(department_values))
        )

        low_stock_query = (
            low_stock_query
            .join(models.Department, models.Product.department_id == models.Department.id)
            .filter(func.lower(models.Department.name).in_(department_values))
        )

        recommendations_query = (
            recommendations_query
            .join(models.Department, models.Product.department_id == models.Department.id)
            .filter(func.lower(models.Department.name).in_(department_values))
        )

        anomalies_query = (
            anomalies_query
            .join(models.Department, models.Product.department_id == models.Department.id)
            .filter(func.lower(models.Department.name).in_(department_values))
        )

    total_products = products_query.count()
    total_variants = variants_query.count()

    low_stock_count = low_stock_query.filter(
        models.ProductVariant.current_stock <= models.ProductVariant.safety_stock
    ).count()

    critical_recommendations = recommendations_query.filter(
        models.AIRecommendation.priority == "critical",
        models.AIRecommendation.status == "new",
    ).count()

    anomalies_count = anomalies_query.filter(
        models.AnomalyLog.resolved.is_(False)
    ).count()

    return {
        "total_products": total_products,
        "total_variants": total_variants,
        "low_stock_count": low_stock_count,
        "critical_recommendations": critical_recommendations,
        "anomalies_count": anomalies_count,
    }


def get_recommendations(
    db: Session,
    limit: int = 50,
    priority: str | None = None,
    status: str | None = None,
    recommendation_type: str | None = None,
):
    query = db.query(models.AIRecommendation)

    if priority:
        query = query.filter(models.AIRecommendation.priority == priority)

    if status:
        query = query.filter(models.AIRecommendation.status == status)

    if recommendation_type:
        query = query.filter(models.AIRecommendation.recommendation_type == recommendation_type)

    return (
        query.order_by(models.AIRecommendation.recommendation_date.desc())
        .limit(limit)
        .all()
    )


def get_anomalies(
    db: Session,
    limit: int = 50,
    severity: str | None = None,
    resolved: bool | None = None,
    anomaly_type: str | None = None,
):
    query = db.query(models.AnomalyLog)

    if severity:
        query = query.filter(models.AnomalyLog.severity == severity)

    if resolved is not None:
        query = query.filter(models.AnomalyLog.resolved.is_(resolved))

    if anomaly_type:
        query = query.filter(models.AnomalyLog.anomaly_type == anomaly_type)

    return (
        query.order_by(models.AnomalyLog.detected_at.desc())
        .limit(limit)
        .all()
    )


def search_products(db: Session, q: str, limit: int = 30):
    rows = (
        db.query(models.ProductVariant)
        .options(
            joinedload(models.ProductVariant.product).joinedload(models.Product.department)
        )
        .join(models.Product, models.ProductVariant.product_id == models.Product.id)
        .filter(
            or_(
                models.Product.name.ilike(f"%{q}%"),
                models.Product.sku.ilike(f"%{q}%"),
                models.ProductVariant.full_sku.ilike(f"%{q}%"),
                models.ProductVariant.barcode.ilike(f"%{q}%"),
            )
        )
        .order_by(models.Product.name.asc(), models.ProductVariant.id.asc())
        .limit(limit)
        .all()
    )

    result = []
    for variant in rows:
        product = variant.product
        department = product.department if product else None

        result.append({
            "variant_id": variant.id,
            "product_id": product.id if product else None,
            "product_name": product.name if product else "",
            "product_sku": product.sku if product else "",
            "full_sku": variant.full_sku,
            "barcode": variant.barcode,
            "current_stock": int(variant.current_stock or 0),
            "reserved_stock": int(variant.reserved_stock or 0),
            "safety_stock": int(variant.safety_stock or 0),
            "department_name": department.name if department else None,
        })

    return result


def get_variant_forecast(db: Session, variant_id: int, limit: int = 7):
    return (
        db.query(models.ForecastResult)
        .filter(models.ForecastResult.variant_id == variant_id)
        .order_by(models.ForecastResult.target_date.asc())
        .limit(limit)
        .all()
    )


def get_variant_recommendations(db: Session, variant_id: int, limit: int = 10):
    return (
        db.query(models.AIRecommendation)
        .filter(models.AIRecommendation.variant_id == variant_id)
        .order_by(models.AIRecommendation.recommendation_date.desc())
        .limit(limit)
        .all()
    )


def get_variant_anomalies(db: Session, variant_id: int, limit: int = 10):
    return (
        db.query(models.AnomalyLog)
        .filter(models.AnomalyLog.variant_id == variant_id)
        .order_by(models.AnomalyLog.detected_at.desc())
        .limit(limit)
        .all()
    )


def get_variant_card(db: Session, variant_id: int):
    variant = (
        db.query(models.ProductVariant)
        .options(
            joinedload(models.ProductVariant.product).joinedload(models.Product.supplier),
            joinedload(models.ProductVariant.product).joinedload(models.Product.product_type),
            joinedload(models.ProductVariant.product).joinedload(models.Product.department),
        )
        .filter(models.ProductVariant.id == variant_id)
        .first()
    )

    if not variant:
        return None

    product = variant.product

    forecasts = get_variant_forecast(db, variant_id, limit=7)
    recent_recommendations = get_variant_recommendations(db, variant_id, limit=5)
    recent_anomalies = get_variant_anomalies(db, variant_id, limit=5)

    return {
        "variant_id": variant.id,
        "product_id": product.id,
        "product_name": product.name,
        "product_sku": product.sku,
        "full_sku": variant.full_sku,
        "barcode": variant.barcode,

        "current_stock": int(variant.current_stock or 0),
        "reserved_stock": int(variant.reserved_stock or 0),
        "min_stock_level": int(variant.min_stock_level or 0),
        "safety_stock": int(variant.safety_stock or 0),
        "lead_time_days": int(variant.lead_time_days or 0),

        "department_name": product.department.name if product.department else None,

        "purchase_price": float(product.purchase_price),
        "sale_price": float(product.sale_price),
        "supplier_name": product.supplier.name if product.supplier else None,
        "product_type_name": product.product_type.name if product.product_type else None,

        "forecasts": forecasts,
        "recent_recommendations": recent_recommendations,
        "recent_anomalies": recent_anomalies,
    }

def get_products(db: Session, limit: int = 50):
    rows = (
        db.query(models.Product)
        .options(
            joinedload(models.Product.supplier),
            joinedload(models.Product.product_type),
            joinedload(models.Product.department),
            joinedload(models.Product.variants),
        )
        .order_by(models.Product.name.asc())
        .limit(limit)
        .all()
    )

    result = []
    for product in rows:
        result.append({
            "product_id": product.id,
            "sku": product.sku,
            "name": product.name,
            "supplier_name": product.supplier.name if product.supplier else None,
            "product_type_name": product.product_type.name if product.product_type else None,
            "purchase_price": float(product.purchase_price),
            "sale_price": float(product.sale_price),
            "is_active": bool(product.is_active),
            "variants_count": len(product.variants or []),
            "department_name": product.department.name if product.department else None,
        })

    return result

def get_variants(db: Session, limit: int = 100):
    rows = (
        db.query(models.ProductVariant)
        .options(
            joinedload(models.ProductVariant.product).joinedload(models.Product.department)
        )
        .order_by(models.ProductVariant.id.asc())
        .limit(limit)
        .all()
    )

    result = []
    for variant in rows:
        product = variant.product

        result.append({
            "variant_id": variant.id,
            "product_id": product.id,
            "product_name": product.name,
            "product_sku": product.sku,
            "full_sku": variant.full_sku,
            "barcode": variant.barcode,
            "current_stock": int(variant.current_stock or 0),
            "reserved_stock": int(variant.reserved_stock or 0),
            "min_stock_level": int(variant.min_stock_level or 0),
            "safety_stock": int(variant.safety_stock or 0),
            "lead_time_days": int(variant.lead_time_days or 0),
            "department_name": product.department.name if product.department else None,
        })

    return result

def get_low_stock_variants(db: Session, limit: int = 100):
    rows = (
        db.query(models.ProductVariant)
        .options(
            joinedload(models.ProductVariant.product).joinedload(models.Product.department)
        )
        .filter(models.ProductVariant.current_stock <= models.ProductVariant.safety_stock)
        .order_by(models.ProductVariant.current_stock.asc(), models.ProductVariant.id.asc())
        .limit(limit)
        .all()
    )

    result = []
    for variant in rows:
        product = variant.product

        result.append({
            "variant_id": variant.id,
            "product_id": product.id,
            "product_name": product.name,
            "product_sku": product.sku,
            "full_sku": variant.full_sku,
            "barcode": variant.barcode,
            "current_stock": int(variant.current_stock or 0),
            "reserved_stock": int(variant.reserved_stock or 0),
            "min_stock_level": int(variant.min_stock_level or 0),
            "safety_stock": int(variant.safety_stock or 0),
            "lead_time_days": int(variant.lead_time_days or 0),
            "department_name": product.department.name if product.department else None,
        })

    return result

def get_notifications(db: Session, limit: int = 30):
    notifications = []

    critical_recommendations = (
        db.query(models.AIRecommendation)
        .filter(
            models.AIRecommendation.priority == "critical",
            models.AIRecommendation.status == "new"
        )
        .order_by(models.AIRecommendation.recommendation_date.desc())
        .limit(10)
        .all()
    )

    for rec in critical_recommendations:
        notifications.append({
            "id": f"recommendation-{rec.id}",
            "type": "recommendation",
            "level": rec.priority,
            "title": "Критическая рекомендация",
            "subtitle": f"Вариант {rec.variant_id}" if rec.variant_id else "Товар",
            "description": rec.reason,
            "target_variant_id": rec.variant_id,
            "target_product_id": rec.product_id,
        })

    active_risks = (
        db.query(models.AnomalyLog)
        .filter(models.AnomalyLog.resolved.is_(False))
        .order_by(models.AnomalyLog.detected_at.desc())
        .limit(10)
        .all()
    )

    for risk in active_risks:
        notifications.append({
            "id": f"risk-{risk.id}",
            "type": "risk",
            "level": risk.severity,
            "title": "Активный риск",
            "subtitle": f"Вариант {risk.variant_id}" if risk.variant_id else "Складской риск",
            "description": risk.description,
            "target_variant_id": risk.variant_id,
            "target_product_id": None,
        })

    low_stock_variants = (
        db.query(models.ProductVariant)
        .options(joinedload(models.ProductVariant.product))
        .filter(models.ProductVariant.current_stock <= models.ProductVariant.safety_stock)
        .order_by(models.ProductVariant.current_stock.asc())
        .limit(10)
        .all()
    )

    for variant in low_stock_variants:
        product = variant.product
        notifications.append({
            "id": f"low-stock-{variant.id}",
            "type": "low_stock",
            "level": "high" if (variant.current_stock or 0) == 0 else "medium",
            "title": "Низкий остаток",
            "subtitle": product.name,
            "description": (
                f"Остаток: {int(variant.current_stock or 0)}, "
                f"страховой запас: {int(variant.safety_stock or 0)}"
            ),
            "target_variant_id": variant.id,
            "target_product_id": product.id,
        })

    priority_order = {
        "critical": 0,
        "high": 1,
        "medium": 2,
        "low": 3,
    }

    notifications.sort(key=lambda item: priority_order.get(item["level"], 99))

    return notifications[:limit]

def _resolve_department_names(department_name: str) -> list[str]:
    normalized = (department_name or "").strip().lower()

    if normalized == "мужской":
        return ["men"]
    if normalized == "женский":
        return ["woman"]
    if normalized == "детский":
        return ["girls", "boys", "baby"]

    return [normalized]

def get_or_create_active_replenishment_task(
    db: Session,
    department_name: str,
    created_by: str | None = None,
    comment: str | None = None,
):
    department_values = _resolve_department_names(department_name)

    department = (
        db.query(models.Department)
        .filter(func.lower(models.Department.name).in_(department_values))
        .first()
    )

    if not department:
        return None

    task = (
        db.query(models.ReplenishmentTask)
        .filter(
            models.ReplenishmentTask.department_id == department.id,
            models.ReplenishmentTask.status.in_(["new", "in_progress"]),
        )
        .order_by(models.ReplenishmentTask.created_at.desc())
        .first()
    )

    if task:
        return task

    task = models.ReplenishmentTask(
        department_id=department.id,
        status="new",
        created_by=created_by,
        comment=comment,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task

def add_replenishment_item(db: Session, payload):
    task = get_or_create_active_replenishment_task(
        db=db,
        department_name=payload.department_name,
        created_by=payload.created_by,
        comment=payload.comment,
    )

    if not task:
        return None

    variant = (
        db.query(models.ProductVariant)
        .options(
            joinedload(models.ProductVariant.product).joinedload(models.Product.department)
        )
        .filter(models.ProductVariant.id == payload.variant_id)
        .first()
    )

    if not variant:
        return None

    existing_item = (
        db.query(models.ReplenishmentTaskItem)
        .filter(
            models.ReplenishmentTaskItem.task_id == task.id,
            models.ReplenishmentTaskItem.variant_id == payload.variant_id,
            models.ReplenishmentTaskItem.status.in_(["new", "picked"]),
        )
        .first()
    )

    if existing_item:
        existing_item.requested_qty += payload.requested_qty
        db.commit()
        db.refresh(existing_item)

        db.add(
            models.OperationLog(
                operation_type="replenishment_add",
                variant_id=variant.id,
                quantity=payload.requested_qty,
                department_id=task.department_id,
                employee_name=payload.created_by,
                comment=f"Добавлено к существующей позиции пополнения. Источник: {payload.source}",
            )
        )
        db.commit()
        return existing_item

    item = models.ReplenishmentTaskItem(
        task_id=task.id,
        variant_id=payload.variant_id,
        requested_qty=payload.requested_qty,
        picked_qty=payload.requested_qty,
        status="picked",
        source=payload.source,
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    db.add(
        models.OperationLog(
            operation_type="replenishment_add",
            variant_id=variant.id,
            quantity=payload.requested_qty,
            department_id=task.department_id,
            employee_name=payload.created_by,
            comment=f"Новая позиция пополнения. Источник: {payload.source}",
        )
    )
    db.commit()

    return item

def get_active_replenishment_task(db: Session, department_name: str):
    department_values = _resolve_department_names(department_name)

    department = (
        db.query(models.Department)
        .filter(func.lower(models.Department.name).in_(department_values))
        .first()
    )

    if not department:
        return None

    task = (
        db.query(models.ReplenishmentTask)
        .options(
            joinedload(models.ReplenishmentTask.department),
            joinedload(models.ReplenishmentTask.items)
            .joinedload(models.ReplenishmentTaskItem.variant)
            .joinedload(models.ProductVariant.product)
            .joinedload(models.Product.department),
        )
        .filter(
            models.ReplenishmentTask.department_id == department.id,
            models.ReplenishmentTask.status.in_(["new", "in_progress"]),
        )
        .order_by(models.ReplenishmentTask.created_at.desc())
        .first()
    )

    if not task:
        return None

    return task

def update_replenishment_item(db: Session, item_id: int, payload):
    item = (
        db.query(models.ReplenishmentTaskItem)
        .options(
            joinedload(models.ReplenishmentTaskItem.task),
            joinedload(models.ReplenishmentTaskItem.variant)
            .joinedload(models.ProductVariant.product)
        )
        .filter(models.ReplenishmentTaskItem.id == item_id)
        .first()
    )

    if not item:
        return None

    item.status = payload.status

    if payload.picked_qty is not None:
        item.picked_qty = payload.picked_qty

    if item.status == "picked":
        item.task.status = "in_progress"

    if item.status == "moved":
        qty = payload.picked_qty if payload.picked_qty is not None else item.requested_qty
        item.picked_qty = qty

        db.add(
            models.OperationLog(
                operation_type="replenishment_done",
                variant_id=item.variant_id,
                quantity=qty,
                department_id=item.task.department_id,
                employee_name=payload.employee_name,
                comment=payload.comment or "Товар вынесен в зал",
            )
        )

    if item.status == "missing":
        qty = payload.picked_qty if payload.picked_qty is not None else item.requested_qty
        item.picked_qty = 0

        db.add(
            models.OperationLog(
                operation_type="replenishment_missing",
                variant_id=item.variant_id,
                quantity=qty,
                department_id=item.task.department_id,
                employee_name=payload.employee_name,
                comment=payload.comment or "Товар отсутствует на складе",
            )
        )

    db.commit()
    db.refresh(item)

    active_items_count = (
        db.query(models.ReplenishmentTaskItem)
        .filter(
            models.ReplenishmentTaskItem.task_id == item.task_id,
            models.ReplenishmentTaskItem.status == "picked",
        )
        .count()
    )

    if active_items_count == 0:
        item.task.status = "done"
        db.commit()

    return item

def _serialize_replenishment_item(item):
    variant = item.variant
    product = variant.product if variant else None
    department = product.department if product else None

    return {
        "item_id": item.id,
        "task_id": item.task_id,
        "variant_id": variant.id if variant else None,
        "product_id": product.id if product else None,
        "product_name": product.name if product else "",
        "product_sku": product.sku if product else "",
        "full_sku": variant.full_sku if variant else "",
        "barcode": variant.barcode if variant else None,
        "department_name": department.name if department else None,
        "current_stock": int(variant.current_stock or 0) if variant else 0,
        "requested_qty": int(item.requested_qty or 0),
        "picked_qty": int(item.picked_qty or 0),
        "status": item.status,
        "source": item.source,
        "created_at": item.created_at,
    }

def serialize_replenishment_task(task):
    return {
        "task_id": task.id,
        "department_name": task.department.name if task.department else None,
        "status": task.status,
        "created_by": task.created_by,
        "comment": task.comment,
        "created_at": task.created_at,
        "items": [_serialize_replenishment_item(item) for item in task.items],
    }

def get_sales_report(
    db: Session,
    period: str = "day",
    department: str | None = None,
    subdepartment: str | None = None,
    only_in_stock: bool = True,
    limit: int = 100,
):
    today = datetime.now().date()

    if period == "shift":
        date_from = today - timedelta(days=1)
    elif period == "week":
        date_from = today - timedelta(days=7)
    else:
        date_from = today - timedelta(days=1)

    query = (
        db.query(
            models.ProductVariant.id.label("variant_id"),
            models.Product.id.label("product_id"),
            models.Product.name.label("product_name"),
            models.Product.sku.label("product_sku"),
            models.ProductVariant.full_sku.label("full_sku"),
            models.ProductVariant.barcode.label("barcode"),
            models.Department.name.label("department_name"),
            func.sum(models.SalesHistory.quantity).label("sold_qty"),
            models.ProductVariant.current_stock.label("current_stock"),
            models.ProductVariant.reserved_stock.label("reserved_stock"),
            models.ProductVariant.safety_stock.label("safety_stock"),
        )
        .join(models.SalesHistory, models.SalesHistory.variant_id == models.ProductVariant.id)
        .join(models.Product, models.ProductVariant.product_id == models.Product.id)
        .join(models.Department, models.Product.department_id == models.Department.id)
        .filter(models.SalesHistory.sale_date >= date_from)
    )

    if only_in_stock:
        query = query.filter(models.ProductVariant.current_stock > 0)

    normalized_department = (department or "").strip().lower()
    normalized_subdepartment = (subdepartment or "").strip().lower()

    if normalized_department and normalized_department != "all":
        if normalized_department == "мужской":
            query = query.filter(func.lower(models.Department.name) == "men")
        elif normalized_department == "женский":
            query = query.filter(func.lower(models.Department.name) == "woman")
        elif normalized_department == "детский":
            if normalized_subdepartment == "девочки":
                query = query.filter(func.lower(models.Department.name) == "girls")
            elif normalized_subdepartment == "мальчики":
                query = query.filter(func.lower(models.Department.name) == "boys")
            elif normalized_subdepartment == "малыши":
                query = query.filter(func.lower(models.Department.name) == "baby")
            else:
                query = query.filter(
                    func.lower(models.Department.name).in_(["girls", "boys", "baby"])
                )

    rows = (
        query.group_by(
            models.ProductVariant.id,
            models.Product.id,
            models.Product.name,
            models.Product.sku,
            models.ProductVariant.full_sku,
            models.ProductVariant.barcode,
            models.Department.name,
            models.ProductVariant.current_stock,
            models.ProductVariant.reserved_stock,
            models.ProductVariant.safety_stock,
        )
        .order_by(func.sum(models.SalesHistory.quantity).desc(), models.Product.name.asc())
        .limit(limit)
        .all()
    )

    result = []
    for row in rows:
        result.append(
            {
                "variant_id": row.variant_id,
                "product_id": row.product_id,
                "product_name": row.product_name,
                "product_sku": row.product_sku,
                "full_sku": row.full_sku,
                "barcode": row.barcode,
                "department_name": row.department_name,
                "sold_qty": int(row.sold_qty or 0),
                "current_stock": int(row.current_stock or 0),
                "reserved_stock": int(row.reserved_stock or 0),
                "safety_stock": int(row.safety_stock or 0),
            }
        )

    return result

def accept_receipt_item(db: Session, payload):
    department_values = _resolve_department_names(payload.department_name)

    variant = (
        db.query(models.ProductVariant)
        .options(
            joinedload(models.ProductVariant.product).joinedload(models.Product.department)
        )
        .filter(models.ProductVariant.id == payload.variant_id)
        .first()
    )

    if not variant:
        return None

    product = variant.product
    department = product.department if product else None

    if not department:
        return None

    normalized_department_name = (department.name or "").strip().lower()
    if normalized_department_name not in department_values:
        return None

    variant.current_stock = int(variant.current_stock or 0) + payload.accepted_qty

    db.add(
        models.OperationLog(
            operation_type="receipt_accept",
            variant_id=variant.id,
            quantity=payload.accepted_qty,
            department_id=department.id,
            employee_name=payload.employee_name,
            comment=payload.comment or "Приемка поставки",
        )
    )

    db.commit()
    db.refresh(variant)

    return {
        "variant_id": variant.id,
        "product_id": product.id if product else None,
        "product_name": product.name if product else "",
        "product_sku": product.sku if product else "",
        "full_sku": variant.full_sku,
        "barcode": variant.barcode,
        "department_name": department.name if department else None,
        "accepted_qty": payload.accepted_qty,
        "current_stock": int(variant.current_stock or 0),
        "reserved_stock": int(variant.reserved_stock or 0),
        "safety_stock": int(variant.safety_stock or 0),
    }

def get_operations_log(
    db: Session,
    department: str | None = None,
    subdepartment: str | None = None,
    operation_type: str | None = None,
    period: str = "week",
    limit: int = 100,
):
    now = datetime.now()

    if period == "day":
        date_from = now - timedelta(days=1)
    elif period == "month":
        date_from = now - timedelta(days=30)
    else:
        date_from = now - timedelta(days=7)

    query = (
        db.query(models.OperationLog)
        .options(
            joinedload(models.OperationLog.variant)
            .joinedload(models.ProductVariant.product)
            .joinedload(models.Product.department),
            joinedload(models.OperationLog.department),
        )
        .filter(models.OperationLog.created_at >= date_from)
    )

    normalized_department = (department or "").strip().lower()
    normalized_subdepartment = (subdepartment or "").strip().lower()

    if normalized_department and normalized_department != "all":
        if normalized_department == "мужской":
            query = query.join(
                models.ProductVariant,
                models.OperationLog.variant_id == models.ProductVariant.id,
            ).join(
                models.Product,
                models.ProductVariant.product_id == models.Product.id,
            ).join(
                models.Department,
                models.Product.department_id == models.Department.id,
            ).filter(
                func.lower(models.Department.name) == "men"
            )

        elif normalized_department == "женский":
            query = query.join(
                models.ProductVariant,
                models.OperationLog.variant_id == models.ProductVariant.id,
            ).join(
                models.Product,
                models.ProductVariant.product_id == models.Product.id,
            ).join(
                models.Department,
                models.Product.department_id == models.Department.id,
            ).filter(
                func.lower(models.Department.name) == "woman"
            )

        elif normalized_department == "детский":
            query = query.join(
                models.ProductVariant,
                models.OperationLog.variant_id == models.ProductVariant.id,
            ).join(
                models.Product,
                models.ProductVariant.product_id == models.Product.id,
            ).join(
                models.Department,
                models.Product.department_id == models.Department.id,
            )

            if normalized_subdepartment == "девочки":
                query = query.filter(func.lower(models.Department.name) == "girls")
            elif normalized_subdepartment == "мальчики":
                query = query.filter(func.lower(models.Department.name) == "boys")
            elif normalized_subdepartment == "малыши":
                query = query.filter(func.lower(models.Department.name) == "baby")
            else:
                query = query.filter(
                    func.lower(models.Department.name).in_(["girls", "boys", "baby"])
                )

    if operation_type and operation_type != "all":
        query = query.filter(models.OperationLog.operation_type == operation_type)

    rows = (
        query.order_by(models.OperationLog.created_at.desc())
        .limit(limit)
        .all()
    )

    result = []
    for row in rows:
        variant = row.variant
        product = variant.product if variant else None
        department_obj = product.department if product else row.department

        result.append(
            {
                "id": row.id,
                "operation_type": row.operation_type,
                "variant_id": variant.id if variant else None,
                "product_id": product.id if product else None,
                "product_name": product.name if product else "",
                "product_sku": product.sku if product else "",
                "full_sku": variant.full_sku if variant else "",
                "quantity": int(row.quantity or 0),
                "department_name": department_obj.name if department_obj else None,
                "employee_name": row.employee_name,
                "comment": row.comment,
                "created_at": row.created_at,
            }
        )

    return result

def compute_sales_metrics(db: Session, variant_id: int):
    today = datetime.now().date()

    def get_sum(days: int):
        value = (
            db.query(
                func.coalesce(
                    func.sum(models.SalesHistory.quantity),
                    0
                )
            )
            .filter(
                models.SalesHistory.variant_id == variant_id,
                models.SalesHistory.sale_date >= today - timedelta(days=days),
            )
            .scalar()
        )
        return int(value or 0)

    sales_7d = get_sum(7)
    sales_14d = get_sum(14)
    sales_30d = get_sum(30)

    avg_daily_sales_7d = round(float(sales_7d) / 7, 2)

    return {
        "sold_qty_7d": sales_7d,
        "sold_qty_14d": sales_14d,
        "sold_qty_30d": sales_30d,
        "avg_daily_sales_7d": avg_daily_sales_7d,
    }


def compute_stock_risk(variant, sales_metrics: dict):
    current_stock = int(variant.current_stock or 0)
    safety_stock = int(variant.safety_stock or 0)
    reserved_stock = int(variant.reserved_stock or 0)
    lead_time_days = int(variant.lead_time_days or 0)
    avg_daily_sales = float(sales_metrics["avg_daily_sales_7d"] or 0)

    available_stock = max(current_stock - reserved_stock, 0)

    if avg_daily_sales > 0:
        stock_cover_days = round(available_stock / avg_daily_sales, 2)
    else:
        stock_cover_days = None

    risk_score = 0.0

    if current_stock <= safety_stock:
        risk_score += 40

    if stock_cover_days is not None and stock_cover_days < lead_time_days:
        risk_score += 35

    if sales_metrics["sold_qty_7d"] >= 10:
        risk_score += 15

    if reserved_stock > 0:
        risk_score += 10

    risk_score = min(risk_score, 100)

    return {
        "stock_cover_days": stock_cover_days,
        "stock_risk_score": round(risk_score, 2),
    }


def compute_reorder_need(variant, sales_metrics: dict, stock_metrics: dict):
    current_stock = int(variant.current_stock or 0)
    safety_stock = int(variant.safety_stock or 0)
    lead_time_days = int(variant.lead_time_days or 0)
    avg_daily_sales = float(sales_metrics["avg_daily_sales_7d"] or 0)

    predicted_need_for_lead_time = round(avg_daily_sales * max(lead_time_days, 1))
    target_stock = safety_stock + predicted_need_for_lead_time
    suggested_quantity = max(target_stock - current_stock, 0)

    reorder_score = 0.0

    if stock_metrics["stock_cover_days"] is not None and stock_metrics["stock_cover_days"] < lead_time_days:
        reorder_score += 45

    if current_stock <= safety_stock:
        reorder_score += 30

    if sales_metrics["sold_qty_14d"] >= 15:
        reorder_score += 15

    if suggested_quantity > 0:
        reorder_score += 10

    reorder_score = min(reorder_score, 100)

    return {
        "reorder_score": round(reorder_score, 2),
        "suggested_quantity": int(suggested_quantity),
    }


def compute_display_opportunity(variant, sales_metrics):
    sold_7d = int(sales_metrics["sold_qty_7d"])
    current_stock = int(variant.current_stock or 0)

    score = 0

    if sold_7d >= 5:
        score += 30

    if sold_7d >= 10:
        score += 30

    if current_stock >= 15:
        score += 20

    if current_stock >= 30:
        score += 20

    return {
        "display_score": min(score, 100)
    }

def compute_slow_mover_flag(variant, sales_metrics: dict):
    current_stock = int(variant.current_stock or 0)

    slow_mover_score = 0.0

    if sales_metrics["sold_qty_30d"] <= 2:
        slow_mover_score += 50

    if current_stock >= max(int(variant.safety_stock or 0) * 3, 20):
        slow_mover_score += 30

    if variant.abc_class == "C":
        slow_mover_score += 10

    if variant.xyz_class == "Z":
        slow_mover_score += 10

    slow_mover_score = min(slow_mover_score, 100)

    return {
        "slow_mover_score": round(slow_mover_score, 2),
    }


def _resolve_ai_priority(stock_risk_score, reorder_score, display_score, slow_mover_score):
    max_score = max(stock_risk_score, reorder_score, display_score, slow_mover_score)

    if max_score >= 80:
        return "critical"
    if max_score >= 60:
        return "high"
    if max_score >= 35:
        return "medium"
    return "low"

def _resolve_ai_recommendation_type(
    variant,
    sales_metrics,
    stock_metrics,
    reorder_metrics,
    display_metrics,
    slow_metrics,
):
    current_stock = int(variant.current_stock or 0)
    safety_stock = int(variant.safety_stock or 0)
    sold_7d = int(sales_metrics["sold_qty_7d"])

    if reorder_metrics["reorder_score"] >= 60:
        return "replenish", "Заказать поставку"

    if (
        stock_metrics["stock_risk_score"] >= 60
        and current_stock > 0
    ):
        return "replenish", "Срочно пополнить зал"

    if (
        sold_7d >= 8
        and current_stock > safety_stock * 2
        and stock_metrics["stock_risk_score"] < 50
    ):
        return "transfer", "Усилить выкладку"

    if slow_metrics["slow_mover_score"] >= 60:
        return "markdown", "Слабая оборачиваемость"

    return "hold", "Наблюдать"

def _build_ai_reason(
    variant,
    sales_metrics,
    stock_metrics,
    reorder_metrics,
    display_metrics,
    slow_metrics,
    title,
):
    reasons = []

    if sales_metrics["sold_qty_7d"] > 0:
        reasons.append(
            f"продажи за 7 дней: {sales_metrics['sold_qty_7d']}"
        )

    if int(variant.current_stock or 0) <= int(variant.safety_stock or 0):
        reasons.append("остаток ниже или равен страховому запасу")

    if stock_metrics["stock_cover_days"] is not None:
        reasons.append(
            f"покрытие остатком: {stock_metrics['stock_cover_days']} дн."
        )

    if title == "Заказать поставку":
        reasons.append(
            f"lead time: {int(variant.lead_time_days or 0)} дн."
        )
        reasons.append(
            f"рекомендуемый заказ: {reorder_metrics['suggested_quantity']}"
        )

    if title == "Срочно пополнить зал":
        reasons.append(
            "товар активно продается и требует оперативного пополнения"
        )

    if title == "Усилить выкладку":
        reasons.append(
            "товар показывает высокий спрос и подходит для приоритетной выкладки"
        )

    if title == "Слабая оборачиваемость":
        reasons.append(
            f"продажи за 30 дней: {sales_metrics['sold_qty_30d']}"
        )

    if not reasons:
        return (
            "Недостаточно оснований для активного действия, "
            "рекомендуется наблюдение."
        )

    return ", ".join(reasons).capitalize() + "."

def get_ai_recommendation_center(
    db: Session,
    department: str | None = None,
    subdepartment: str | None = None,
    limit: int = 100,
):
    query = (
        db.query(models.ProductVariant)
        .options(
            joinedload(models.ProductVariant.product).joinedload(
                models.Product.department
            )
        )
        .join(
            models.Product,
            models.ProductVariant.product_id == models.Product.id,
        )
        .join(
            models.Department,
            models.Product.department_id == models.Department.id,
        )
    )

    normalized_department = (department or "").strip().lower()
    normalized_subdepartment = (subdepartment or "").strip().lower()

    if normalized_department and normalized_department != "all":
        if normalized_department == "мужской":
            query = query.filter(
                func.lower(models.Department.name) == "men"
            )

        elif normalized_department == "женский":
            query = query.filter(
                func.lower(models.Department.name) == "woman"
            )

        elif normalized_department == "детский":
            if normalized_subdepartment == "девочки":
                query = query.filter(
                    func.lower(models.Department.name) == "girls"
                )

            elif normalized_subdepartment == "мальчики":
                query = query.filter(
                    func.lower(models.Department.name) == "boys"
                )

            elif normalized_subdepartment == "малыши":
                query = query.filter(
                    func.lower(models.Department.name) == "baby"
                )

            else:
                query = query.filter(
                    func.lower(models.Department.name).in_(
                        ["girls", "boys", "baby"]
                    )
                )

    variants = query.limit(200).all()

    result = []

    for variant in variants:
        product = variant.product
        department_obj = product.department if product else None

        sales_metrics = compute_sales_metrics(db, variant.id)

        stock_metrics = compute_stock_risk(
            variant,
            sales_metrics,
        )

        reorder_metrics = compute_reorder_need(
            variant,
            sales_metrics,
            stock_metrics,
        )

        display_metrics = compute_display_opportunity(
            variant,
            sales_metrics,
        )

        slow_metrics = compute_slow_mover_flag(
            variant,
            sales_metrics,
        )

        base_priority = _resolve_ai_priority(
            stock_metrics["stock_risk_score"],
            reorder_metrics["reorder_score"],
            display_metrics["display_score"],
            slow_metrics["slow_mover_score"],
        )

        base_recommendation_type, base_title = (
            _resolve_ai_recommendation_type(
                variant,
                sales_metrics,
                stock_metrics,
                reorder_metrics,
                display_metrics,
                slow_metrics,
            )
        )

        base_reason = _build_ai_reason(
            variant,
            sales_metrics,
            stock_metrics,
            reorder_metrics,
            display_metrics,
            slow_metrics,
            base_title,
        )

        result.append(
            {
                "variant_id": int(variant.id),

                "product_id": int(product.id)
                if product
                else 0,

                "product_name": product.name
                if product
                else "",

                "product_sku": product.sku
                if product
                else "",

                "full_sku": variant.full_sku or "",
                "barcode": variant.barcode,

                "department_name": (
                    department_obj.name
                    if department_obj
                    else None
                ),

                "sold_qty_7d": int(
                    sales_metrics["sold_qty_7d"]
                ),

                "sold_qty_14d": int(
                    sales_metrics["sold_qty_14d"]
                ),

                "sold_qty_30d": int(
                    sales_metrics["sold_qty_30d"]
                ),

                "avg_daily_sales_7d": float(
                    sales_metrics["avg_daily_sales_7d"]
                ),

                "current_stock": int(
                    variant.current_stock or 0
                ),

                "reserved_stock": int(
                    variant.reserved_stock or 0
                ),

                "safety_stock": int(
                    variant.safety_stock or 0
                ),

                "lead_time_days": int(
                    variant.lead_time_days or 0
                ),

                "stock_cover_days": (
                    float(stock_metrics["stock_cover_days"])
                    if stock_metrics["stock_cover_days"] is not None
                    else None
                ),

                "priority": str(base_priority),

                "recommendation_type": str(
                    base_recommendation_type
                ),

                "title": str(base_title),

                "reason": str(base_reason),

                "suggested_quantity": int(
                    reorder_metrics["suggested_quantity"]
                ),

                "stock_risk_score": float(
                    stock_metrics["stock_risk_score"]
                ),

                "reorder_score": float(
                    reorder_metrics["reorder_score"]
                ),

                "display_score": float(
                    display_metrics["display_score"]
                ),

                "slow_mover_score": float(
                    slow_metrics["slow_mover_score"]
                ),
            }
        )

    result.sort(
        key=lambda x: (
            {
                "critical": 4,
                "high": 3,
                "medium": 2,
                "low": 1,
            }.get(x["priority"], 0),

            x["display_score"],
            x["reorder_score"],
            x["stock_risk_score"],
            x["slow_mover_score"],
        ),
        reverse=True,
    )

    # Gemini только для top-5
    top_for_llm = result[:5]

    for item in top_for_llm:
        try:
            ai_result = generate_ai_recommendation_explanation(item)

            item["title"] = ai_result["title"]
            item["reason"] = ai_result["reason"]
            item["recommendation_type"] = ai_result["recommendation_type"]
            item["priority"] = ai_result["priority"]

        except Exception as llm_error:
            print(
                f"[GEMINI ERROR] "
                f"variant_id={item['variant_id']}: "
                f"{llm_error}"
            )

    return result[:limit]

def create_purchase_order(db: Session, payload):
    supplier = (
        db.query(models.Supplier)
        .filter(models.Supplier.id == payload.supplier_id)
        .first()
    )

    if not supplier:
        return None

    order = models.PurchaseOrder(
        supplier_id=payload.supplier_id,
        status="draft",
        created_by=payload.created_by,
        comment=payload.comment,
        expected_date=payload.expected_date,
    )

    db.add(order)
    db.flush()

    for item_payload in payload.items:
        variant = (
            db.query(models.ProductVariant)
            .options(
                joinedload(models.ProductVariant.product)
            )
            .filter(
                models.ProductVariant.id == item_payload.variant_id
            )
            .first()
        )

        if not variant:
            continue

        product = variant.product

        order_item = models.PurchaseOrderItem(
            purchase_order_id=order.id,
            variant_id=variant.id,
            ordered_qty=item_payload.ordered_qty,
            received_qty=0,
            purchase_price=float(product.purchase_price or 0),
            status="new",
        )

        db.add(order_item)

        db.add(
            models.OperationLog(
                operation_type="purchase_order_created",
                variant_id=variant.id,
                quantity=item_payload.ordered_qty,
                employee_name=payload.created_by,
                comment="Создан заказ поставщику",
            )
        )

    db.commit()
    db.refresh(order)

    return order

def get_purchase_orders(
    db: Session,
    status: str | None = None,
    limit: int = 50,
):
    query = (
        db.query(models.PurchaseOrder)
        .options(
            joinedload(models.PurchaseOrder.supplier),
            joinedload(models.PurchaseOrder.items)
            .joinedload(models.PurchaseOrderItem.variant)
            .joinedload(models.ProductVariant.product),
        )
    )

    if status:
        query = query.filter(
            models.PurchaseOrder.status == status
        )

    return (
        query.order_by(
            models.PurchaseOrder.created_at.desc()
        )
        .limit(limit)
        .all()
    )

def receive_purchase_order_item(
    db: Session,
    item_id: int,
    payload,
):
    item = (
        db.query(models.PurchaseOrderItem)
        .options(
            joinedload(models.PurchaseOrderItem.purchase_order),
            joinedload(models.PurchaseOrderItem.variant)
            .joinedload(models.ProductVariant.product),
        )
        .filter(models.PurchaseOrderItem.id == item_id)
        .first()
    )

    if not item:
        return None

    variant = item.variant

    variant.current_stock = int(
        variant.current_stock or 0
    ) + payload.received_qty

    item.received_qty += payload.received_qty

    if item.received_qty >= item.ordered_qty:
        item.status = "received"
    else:
        item.status = "partial"

    order = item.purchase_order

    all_received = all(
        x.status == "received"
        for x in order.items
    )

    if all_received:
        order.status = "received"
    else:
        order.status = "partial"

    db.add(
        models.OperationLog(
            operation_type="purchase_order_received",
            variant_id=variant.id,
            quantity=payload.received_qty,
            employee_name=payload.employee_name,
            comment=payload.comment or "Приемка поставки",
        )
    )

    db.commit()

    db.refresh(item)

    return item

def serialize_purchase_order(order):
    return {
        "order_id": order.id,

        "supplier_id": order.supplier_id,

        "supplier_name": (
            order.supplier.name
            if order.supplier
            else None
        ),

        "status": order.status,

        "created_by": order.created_by,
        "comment": order.comment,

        "expected_date": order.expected_date,

        "created_at": order.created_at,

        "items": [
            {
                "item_id": item.id,

                "variant_id": item.variant.id,

                "product_id": item.variant.product.id,

                "product_name": item.variant.product.name,

                "product_sku": item.variant.product.sku,

                "full_sku": item.variant.full_sku,

                "ordered_qty": int(item.ordered_qty or 0),

                "received_qty": int(item.received_qty or 0),

                "purchase_price": float(
                    item.purchase_price or 0
                ),

                "status": item.status,
            }
            for item in order.items
        ]
    }