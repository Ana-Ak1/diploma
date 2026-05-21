from datetime import date, datetime
from typing import Optional, List, Any
from pydantic import BaseModel, ConfigDict, Field
from typing import Literal


class DashboardSummary(BaseModel):
    total_products: int
    total_variants: int
    low_stock_count: int
    critical_recommendations: int
    anomalies_count: int


class RecommendationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    variant_id: Optional[int]
    recommendation_date: datetime
    recommendation_type: str
    priority: str
    suggested_quantity: int
    reason: str
    explanation: dict[str, Any]
    status: str
    approved_by: Optional[str]
    approved_at: Optional[datetime]


class AnomalyOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    variant_id: Optional[int]
    detected_at: datetime
    anomaly_type: str
    severity: str
    actual_value: Optional[float]
    expected_value: Optional[float]
    deviation_percent: Optional[float]
    description: str
    resolved: bool
    resolved_at: Optional[datetime]


class ForecastOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    target_date: date
    horizon_days: int
    predicted_demand: float
    lower_bound: Optional[float]
    upper_bound: Optional[float]
    confidence: Optional[float]


class VariantCard(BaseModel):
    variant_id: int
    product_id: int
    product_name: str
    product_sku: str
    full_sku: str
    barcode: Optional[str]

    current_stock: int
    reserved_stock: int
    min_stock_level: int
    safety_stock: int
    lead_time_days: int

    department_name: Optional[str]

    purchase_price: float
    sale_price: float
    supplier_name: Optional[str]
    product_type_name: Optional[str]

    forecasts: List[ForecastOut] = []
    recent_recommendations: List[RecommendationOut] = []
    recent_anomalies: List[AnomalyOut] = []

class ProductListItem(BaseModel):
    product_id: int
    sku: str
    name: str
    supplier_name: Optional[str]
    product_type_name: Optional[str]
    purchase_price: float
    sale_price: float
    is_active: bool
    variants_count: int
    department_name: Optional[str]


class VariantListItem(BaseModel):
    variant_id: int
    product_id: int
    product_name: str
    product_sku: str
    full_sku: str
    barcode: Optional[str]
    current_stock: int
    reserved_stock: int
    min_stock_level: int
    safety_stock: int
    lead_time_days: int
    department_name: Optional[str]


class NotificationItem(BaseModel):
    id: str
    type: Literal["recommendation", "risk", "low_stock"]
    level: str
    title: str
    subtitle: Optional[str]
    description: str
    target_variant_id: Optional[int] = None
    target_product_id: Optional[int] = None


class ReplenishmentTaskItemCreate(BaseModel):
    department_name: str
    variant_id: int
    requested_qty: int = Field(..., ge=1)
    source: Literal["manual", "sales_report", "ai_recommendation"] = "manual"
    created_by: Optional[str] = None
    comment: Optional[str] = None


class ReplenishmentTaskItemUpdate(BaseModel):
    status: Literal["picked", "moved", "missing"]
    picked_qty: Optional[int] = Field(default=None, ge=0)
    employee_name: Optional[str] = None
    comment: Optional[str] = None


class ReplenishmentTaskItemOut(BaseModel):
    item_id: int
    task_id: int
    variant_id: int
    product_id: int
    product_name: str
    product_sku: str
    full_sku: str
    barcode: Optional[str]
    department_name: Optional[str]
    current_stock: int
    requested_qty: int
    picked_qty: int
    status: str
    source: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ReplenishmentTaskOut(BaseModel):
    task_id: int
    department_name: Optional[str]
    status: str
    created_by: Optional[str]
    comment: Optional[str]
    created_at: datetime
    items: List[ReplenishmentTaskItemOut] = []

    model_config = ConfigDict(from_attributes=True)

class ProductSearchItem(BaseModel):
    variant_id: int
    product_id: int
    product_name: str
    product_sku: str
    full_sku: str
    barcode: Optional[str]
    current_stock: int
    reserved_stock: int
    safety_stock: int
    department_name: Optional[str]

class SalesReportItem(BaseModel):
    variant_id: int
    product_id: int
    product_name: str
    product_sku: str
    full_sku: str
    barcode: Optional[str]
    department_name: Optional[str]
    sold_qty: int
    current_stock: int
    reserved_stock: int
    safety_stock: int

class ReceiptItemCreate(BaseModel):
    department_name: str
    variant_id: int
    accepted_qty: int = Field(..., ge=1)
    employee_name: Optional[str] = None
    comment: Optional[str] = None


class ReceiptItemOut(BaseModel):
    variant_id: int
    product_id: int
    product_name: str
    product_sku: str
    full_sku: str
    barcode: Optional[str]
    department_name: Optional[str]
    accepted_qty: int
    current_stock: int
    reserved_stock: int
    safety_stock: int

class OperationLogItem(BaseModel):
    id: int
    operation_type: str
    variant_id: Optional[int]
    product_id: Optional[int]
    product_name: str
    product_sku: str
    full_sku: str
    quantity: int
    department_name: Optional[str]
    employee_name: Optional[str]
    comment: Optional[str]
    created_at: datetime

class AIRecommendationCenterItem(BaseModel):
    variant_id: int
    product_id: int
    product_name: str
    product_sku: str
    full_sku: str
    barcode: Optional[str]
    department_name: Optional[str]

    sold_qty_7d: int
    sold_qty_14d: int
    sold_qty_30d: int
    avg_daily_sales_7d: float

    current_stock: int
    reserved_stock: int
    safety_stock: int
    lead_time_days: int

    stock_cover_days: Optional[float]

    priority: str
    recommendation_type: str
    title: str
    reason: str
    suggested_quantity: int

    stock_risk_score: float
    reorder_score: float
    display_score: float
    slow_mover_score: float

class AIChatRequest(BaseModel):
    message: str
    department: Optional[str] = "all"
    subdepartment: Optional[str] = "all"

class AIChatResponse(BaseModel):
    answer: str
    mode: str = "ai"

class PurchaseOrderItemCreate(BaseModel):
    variant_id: int
    ordered_qty: int = Field(..., ge=1)


class PurchaseOrderCreate(BaseModel):
    supplier_id: int
    created_by: Optional[str] = None
    comment: Optional[str] = None
    expected_date: Optional[date] = None

    items: List[PurchaseOrderItemCreate]

class PurchaseOrderReceiveItem(BaseModel):
    received_qty: int = Field(..., ge=1)
    employee_name: Optional[str] = None
    comment: Optional[str] = None

class PurchaseOrderItemOut(BaseModel):
    item_id: int

    variant_id: int
    product_id: int

    product_name: str
    product_sku: str

    full_sku: str

    ordered_qty: int
    received_qty: int

    purchase_price: float

    status: str

    model_config = ConfigDict(from_attributes=True)


class PurchaseOrderOut(BaseModel):
    order_id: int

    supplier_id: int
    supplier_name: Optional[str]

    status: str

    created_by: Optional[str]
    comment: Optional[str]

    expected_date: Optional[date]

    created_at: datetime

    items: List[PurchaseOrderItemOut] = []

    model_config = ConfigDict(from_attributes=True)

