from fastapi import FastAPI, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from fastapi.middleware.cors import CORSMiddleware
from app.schemas import AIChatRequest, AIChatResponse
from app.ai_chat_service import ask_ai_about_database

from app.db import get_db
from app import crud, schemas

app = FastAPI(
    title="MAAG Warehouse AI Demo",
    description="Учебный программный продукт для прогнозирования спроса и поддержки решений по запасам",
    version="1.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/dashboard/summary", response_model=schemas.DashboardSummary)
def dashboard_summary(
    department: str | None = Query(default=None),
    subdepartment: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    return crud.get_dashboard_summary(
        db,
        department=department,
        subdepartment=subdepartment,
    )

@app.get("/recommendations", response_model=list[schemas.RecommendationOut])
def recommendations(
    limit: int = Query(50, ge=1, le=200),
    priority: str | None = Query(None),
    status: str | None = Query(None),
    recommendation_type: str | None = Query(None),
    db: Session = Depends(get_db),
):
    return crud.get_recommendations(
        db,
        limit=limit,
        priority=priority,
        status=status,
        recommendation_type=recommendation_type,
    )


@app.get("/anomalies", response_model=list[schemas.AnomalyOut])
def anomalies(
    limit: int = Query(50, ge=1, le=200),
    severity: str | None = Query(None),
    resolved: bool | None = Query(None),
    anomaly_type: str | None = Query(None),
    db: Session = Depends(get_db),
):
    return crud.get_anomalies(
        db,
        limit=limit,
        severity=severity,
        resolved=resolved,
        anomaly_type=anomaly_type,
    )

@app.get("/products/search", response_model=list[schemas.ProductSearchItem])
def products_search(
    q: str,
    limit: int = Query(30, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return crud.search_products(db, q=q, limit=limit)

@app.get("/variants/low-stock", response_model=list[schemas.VariantListItem])
def low_stock_variants(limit: int = Query(100, ge=1, le=300), db: Session = Depends(get_db)):
    return crud.get_low_stock_variants(db, limit=limit)

@app.get("/variants/{variant_id}", response_model=schemas.VariantCard)
def variant_card(variant_id: int, db: Session = Depends(get_db)):
    result = crud.get_variant_card(db, variant_id)
    if not result:
        raise HTTPException(status_code=404, detail="Вариант товара не найден")
    return result

@app.get("/variants/{variant_id}/forecast", response_model=list[schemas.ForecastOut])
def variant_forecast(
    variant_id: int,
    limit: int = Query(7, ge=1, le=30),
    db: Session = Depends(get_db),
):
    return crud.get_variant_forecast(db, variant_id, limit=limit)

@app.get("/variants/{variant_id}/recommendations", response_model=list[schemas.RecommendationOut])
def variant_recommendations(
    variant_id: int,
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    return crud.get_variant_recommendations(db, variant_id, limit=limit)

@app.get("/variants/{variant_id}/anomalies", response_model=list[schemas.AnomalyOut])
def variant_anomalies(
    variant_id: int,
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    return crud.get_variant_anomalies(db, variant_id, limit=limit)

@app.get("/products", response_model=list[schemas.ProductListItem])
def products(limit: int = Query(50, ge=1, le=200), db: Session = Depends(get_db)):
    return crud.get_products(db, limit=limit)

@app.get("/variants", response_model=list[schemas.VariantListItem])
def variants(limit: int = Query(100, ge=1, le=300), db: Session = Depends(get_db)):
    return crud.get_variants(db, limit=limit)

@app.get("/notifications", response_model=list[schemas.NotificationItem])
def notifications(limit: int = Query(30, ge=1, le=100), db: Session = Depends(get_db)):
    return crud.get_notifications(db, limit=limit)

@app.get("/replenishment/active", response_model=schemas.ReplenishmentTaskOut | None)
def replenishment_active(
    department: str = Query(...),
    db: Session = Depends(get_db),
):
    task = crud.get_active_replenishment_task(db, department_name=department)
    if not task:
        return None
    return crud.serialize_replenishment_task(task)


@app.post("/replenishment/items", response_model=schemas.ReplenishmentTaskItemOut)
def replenishment_add_item(
    payload: schemas.ReplenishmentTaskItemCreate,
    db: Session = Depends(get_db),
):
    item = crud.add_replenishment_item(db, payload)
    if not item:
        raise HTTPException(status_code=404, detail="Не удалось добавить позицию в пополнение")
    item = (
        db.query(crud.models.ReplenishmentTaskItem)
        .options(
            joinedload(crud.models.ReplenishmentTaskItem.variant)
            .joinedload(crud.models.ProductVariant.product)
            .joinedload(crud.models.Product.department)
        )
        .filter(crud.models.ReplenishmentTaskItem.id == item.id)
        .first()
    )
    return crud._serialize_replenishment_item(item)


@app.patch("/replenishment/items/{item_id}", response_model=schemas.ReplenishmentTaskItemOut)
def replenishment_update_item(
    item_id: int,
    payload: schemas.ReplenishmentTaskItemUpdate,
    db: Session = Depends(get_db),
):
    item = crud.update_replenishment_item(db, item_id, payload)
    if not item:
        raise HTTPException(status_code=404, detail="Позиция пополнения не найдена")

    item = (
        db.query(crud.models.ReplenishmentTaskItem)
        .options(
            joinedload(crud.models.ReplenishmentTaskItem.variant)
            .joinedload(crud.models.ProductVariant.product)
            .joinedload(crud.models.Product.department)
        )
        .filter(crud.models.ReplenishmentTaskItem.id == item.id)
        .first()
    )
    return crud._serialize_replenishment_item(item)

@app.get("/sales/report", response_model=list[schemas.SalesReportItem])
def sales_report(
    period: str = Query("day"),
    department: str | None = Query(default=None),
    subdepartment: str | None = Query(default=None),
    only_in_stock: bool = Query(True),
    limit: int = Query(100, ge=1, le=300),
    db: Session = Depends(get_db),
):
    return crud.get_sales_report(
        db=db,
        period=period,
        department=department,
        subdepartment=subdepartment,
        only_in_stock=only_in_stock,
        limit=limit,
    )

@app.post("/receipt/items", response_model=schemas.ReceiptItemOut)
def receipt_accept_item(
    payload: schemas.ReceiptItemCreate,
    db: Session = Depends(get_db),
):
    result = crud.accept_receipt_item(db, payload)
    if not result:
        raise HTTPException(status_code=404, detail="Не удалось принять товар на склад")
    return result

@app.get("/operations/log", response_model=list[schemas.OperationLogItem])
def operations_log(
    department: str | None = Query(default=None),
    subdepartment: str | None = Query(default=None),
    operation_type: str | None = Query(default="all"),
    period: str = Query(default="week"),
    limit: int = Query(100, ge=1, le=300),
    db: Session = Depends(get_db),
):
    return crud.get_operations_log(
        db=db,
        department=department,
        subdepartment=subdepartment,
        operation_type=operation_type,
        period=period,
        limit=limit,
    )

@app.get("/ai/recommendation-center", response_model=list[schemas.AIRecommendationCenterItem])
def ai_recommendation_center(
    department: str | None = Query(default=None),
    subdepartment: str | None = Query(default=None),
    limit: int = Query(100, ge=1, le=300),
    db: Session = Depends(get_db),
):
    return crud.get_ai_recommendation_center(
        db=db,
        department=department,
        subdepartment=subdepartment,
        limit=limit,
    )

@app.post("/ai/chat", response_model=AIChatResponse)
def ai_chat(payload: AIChatRequest, db: Session = Depends(get_db)):
    result = ask_ai_about_database(
        db=db,
        message=payload.message,
        department=payload.department or "all",
        subdepartment=payload.subdepartment or "all",
    )

    return AIChatResponse(
        answer=result["answer"],
        mode=result["mode"],
    )