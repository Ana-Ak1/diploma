from sqlalchemy import Column, BigInteger, Integer, String, Text, Date, DateTime, Boolean, Numeric, ForeignKey, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from app.db import Base


class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(BigInteger, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    contact_details = Column(Text, nullable=True)
    registered_date = Column(Date, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=True)


class ProductType(Base):
    __tablename__ = "product_types"

    id = Column(BigInteger, primary_key=True, index=True)
    name = Column(String(50), nullable=False)


class Product(Base):
    __tablename__ = "products"

    id = Column(BigInteger, primary_key=True, index=True)
    sku = Column(String(50), nullable=False)
    name = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)

    buyer_id = Column(BigInteger, nullable=False)
    family_id = Column(BigInteger, nullable=False)
    material_quality_id = Column(BigInteger, nullable=False)

    product_type_id = Column(BigInteger, ForeignKey("product_types.id"), nullable=False)
    category_id = Column(BigInteger, nullable=False)
    supplier_id = Column(BigInteger, ForeignKey("suppliers.id"), nullable=False)

    size_type = Column(String(100), nullable=False)
    purchase_price = Column(Numeric(10, 2), nullable=False)
    sale_price = Column(Numeric(10, 2), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=True)

    is_active = Column(Boolean, nullable=False, default=True)
    updated_at = Column(DateTime, nullable=False)

    supplier = relationship("Supplier")
    product_type = relationship("ProductType")
    variants = relationship("ProductVariant", back_populates="product")

    department_id = Column(BigInteger, ForeignKey("departments.id"), nullable=False)
    department = relationship("Department")


class ProductVariant(Base):
    __tablename__ = "product_variants"

    id = Column(BigInteger, primary_key=True, index=True)
    product_id = Column(BigInteger, ForeignKey("products.id"), nullable=False)
    size_id = Column(BigInteger, nullable=False)
    color_id = Column(BigInteger, nullable=False)

    full_sku = Column(String(100), nullable=False)
    barcode = Column(String(100), nullable=True)

    current_stock = Column(BigInteger, nullable=False, default=0)
    reserved_stock = Column(BigInteger, nullable=False, default=0)
    min_stock_level = Column(BigInteger, nullable=False, default=0)

    safety_stock = Column(Integer, nullable=False, default=0)
    lead_time_days = Column(Integer, nullable=False, default=7)

    abc_class = Column(String(1), nullable=True)
    xyz_class = Column(String(1), nullable=True)

    last_forecast_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, nullable=False)

    product = relationship("Product", back_populates="variants")
    recommendations = relationship("AIRecommendation", back_populates="variant")
    anomalies = relationship("AnomalyLog", back_populates="variant")
    forecasts = relationship("ForecastResult", back_populates="variant")


class AIRecommendation(Base):
    __tablename__ = "ai_recommendations"

    id = Column(BigInteger, primary_key=True, index=True)
    model_id = Column(BigInteger, nullable=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    variant_id = Column(Integer, ForeignKey("product_variants.id"), nullable=True)

    recommendation_date = Column(DateTime, nullable=False)
    recommendation_type = Column(String(30), nullable=False)
    priority = Column(String(15), nullable=False, default="medium")
    suggested_quantity = Column(Integer, nullable=False, default=0)
    reason = Column(Text, nullable=False)
    explanation = Column(JSONB, nullable=False, default={})
    status = Column(String(15), nullable=False, default="new")

    approved_by = Column(String(100), nullable=True)
    approved_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, nullable=False)
    updated_at = Column(DateTime, nullable=False)

    variant = relationship("ProductVariant", back_populates="recommendations")


class AnomalyLog(Base):
    __tablename__ = "anomaly_log"

    id = Column(BigInteger, primary_key=True, index=True)
    model_id = Column(BigInteger, nullable=True)
    variant_id = Column(Integer, ForeignKey("product_variants.id"), nullable=True)

    detected_at = Column(DateTime, nullable=False)
    anomaly_type = Column(String(40), nullable=False)
    severity = Column(String(15), nullable=False, default="medium")

    actual_value = Column(Numeric(12, 2), nullable=True)
    expected_value = Column(Numeric(12, 2), nullable=True)
    deviation_percent = Column(Numeric(8, 2), nullable=True)

    description = Column(Text, nullable=False)
    resolved = Column(Boolean, nullable=False, default=False)
    resolved_at = Column(DateTime, nullable=True)

    variant = relationship("ProductVariant", back_populates="anomalies")


class ForecastResult(Base):
    __tablename__ = "forecast_results"

    id = Column(BigInteger, primary_key=True, index=True)
    model_id = Column(BigInteger, nullable=False)
    variant_id = Column(Integer, ForeignKey("product_variants.id"), nullable=False)

    forecast_date = Column(Date, nullable=False)
    target_date = Column(Date, nullable=False)
    horizon_days = Column(Integer, nullable=False)

    predicted_demand = Column(Numeric(12, 2), nullable=False)
    lower_bound = Column(Numeric(12, 2), nullable=True)
    upper_bound = Column(Numeric(12, 2), nullable=True)
    confidence = Column(Numeric(5, 4), nullable=True)

    input_snapshot = Column(JSONB, nullable=False, default={})
    created_at = Column(DateTime, nullable=False)

    variant = relationship("ProductVariant", back_populates="forecasts")

class Department(Base):
    __tablename__ = "departments"

    id = Column(BigInteger, primary_key=True, index=True)
    name = Column(String(100), nullable=False)

class ReplenishmentTask(Base):
    __tablename__ = "replenishment_tasks"

    id = Column(BigInteger, primary_key=True, index=True)
    department_id = Column(BigInteger, ForeignKey("departments.id"), nullable=False)
    status = Column(String(20), nullable=False, default="new")
    created_by = Column(String(100))
    comment = Column(Text)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    department = relationship("Department")
    items = relationship(
        "ReplenishmentTaskItem",
        back_populates="task",
        cascade="all, delete-orphan"
    )


class ReplenishmentTaskItem(Base):
    __tablename__ = "replenishment_task_items"

    id = Column(BigInteger, primary_key=True, index=True)
    task_id = Column(BigInteger, ForeignKey("replenishment_tasks.id"), nullable=False)
    variant_id = Column(BigInteger, ForeignKey("product_variants.id"), nullable=False)
    requested_qty = Column(Integer, nullable=False, default=1)
    picked_qty = Column(Integer, nullable=False, default=0)
    status = Column(String(20), nullable=False, default="new")
    source = Column(String(30), nullable=False, default="manual")
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    task = relationship("ReplenishmentTask", back_populates="items")
    variant = relationship("ProductVariant")

class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id = Column(BigInteger, primary_key=True, index=True)

    supplier_id = Column(
        BigInteger,
        ForeignKey("suppliers.id"),
        nullable=False,
    )

    status = Column(
        String(20),
        nullable=False,
        default="draft",
    )
    # draft
    # ordered
    # partial
    # received
    # cancelled

    created_by = Column(String(100))
    comment = Column(Text)

    expected_date = Column(Date, nullable=True)

    created_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
    )

    updated_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    supplier = relationship("Supplier")

    items = relationship(
        "PurchaseOrderItem",
        back_populates="purchase_order",
        cascade="all, delete-orphan",
    )


class PurchaseOrderItem(Base):
    __tablename__ = "purchase_order_items"

    id = Column(BigInteger, primary_key=True, index=True)

    purchase_order_id = Column(
        BigInteger,
        ForeignKey("purchase_orders.id"),
        nullable=False,
    )

    variant_id = Column(
        BigInteger,
        ForeignKey("product_variants.id"),
        nullable=False,
    )

    ordered_qty = Column(Integer, nullable=False, default=0)

    received_qty = Column(Integer, nullable=False, default=0)

    purchase_price = Column(
        Numeric(12, 2),
        nullable=False,
        default=0,
    )

    status = Column(
        String(20),
        nullable=False,
        default="new",
    )
    # new
    # partial
    # received

    created_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
    )

    updated_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    purchase_order = relationship(
        "PurchaseOrder",
        back_populates="items",
    )

    variant = relationship("ProductVariant")

class SupplyOrder(Base):
    __tablename__ = "supply_orders"

    id = Column(BigInteger, primary_key=True, index=True)

    supplier_id = Column(
        BigInteger,
        ForeignKey("suppliers.id"),
        nullable=False
    )

    department_id = Column(
        BigInteger,
        ForeignKey("departments.id"),
        nullable=False
    )

    status = Column(
        String(20),
        nullable=False,
        default="draft"
    )
    # draft / approved / ordered / received / cancelled

    priority = Column(
        String(15),
        nullable=False,
        default="medium"
    )
    # low / medium / high / critical

    expected_delivery_date = Column(DateTime, nullable=True)

    created_by = Column(String(100), nullable=True)

    comment = Column(Text, nullable=True)

    total_items = Column(Integer, nullable=False, default=0)

    created_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now()
    )

    updated_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now()
    )

    supplier = relationship("Supplier")

    department = relationship("Department")

    items = relationship(
        "SupplyOrderItem",
        back_populates="order",
        cascade="all, delete-orphan"
    )


class SupplyOrderItem(Base):
    __tablename__ = "supply_order_items"

    id = Column(BigInteger, primary_key=True, index=True)

    order_id = Column(
        BigInteger,
        ForeignKey("supply_orders.id"),
        nullable=False
    )

    variant_id = Column(
        BigInteger,
        ForeignKey("product_variants.id"),
        nullable=False
    )

    recommended_qty = Column(
        Integer,
        nullable=False,
        default=0
    )

    approved_qty = Column(
        Integer,
        nullable=False,
        default=0
    )

    received_qty = Column(
        Integer,
        nullable=False,
        default=0
    )

    unit_purchase_price = Column(
        Numeric(12, 2),
        nullable=True
    )

    ai_reason = Column(Text, nullable=True)

    status = Column(
        String(20),
        nullable=False,
        default="new"
    )
    # new / approved / ordered / received

    created_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now()
    )

    updated_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now()
    )

    order = relationship(
        "SupplyOrder",
        back_populates="items"
    )

    variant = relationship("ProductVariant")




class OperationLog(Base):
    __tablename__ = "operation_log"

    id = Column(BigInteger, primary_key=True, index=True)
    operation_type = Column(String(30), nullable=False)
    variant_id = Column(BigInteger, ForeignKey("product_variants.id"))
    quantity = Column(Integer, nullable=False, default=0)
    department_id = Column(BigInteger, ForeignKey("departments.id"))
    employee_name = Column(String(100))
    comment = Column(Text)
    created_at = Column(DateTime, nullable=False, server_default=func.now())

    variant = relationship("ProductVariant")
    department = relationship("Department")

class SalesHistory(Base):
    __tablename__ = "sales_history"

    id = Column(BigInteger, primary_key=True, index=True)
    variant_id = Column(BigInteger, ForeignKey("product_variants.id"), nullable=False)
    sale_date = Column(DateTime, nullable=False)
    quantity = Column(Integer, nullable=False, default=0)

    variant = relationship("ProductVariant")
    unit_sale_price = Column(Numeric(12, 2))
    channel = Column(String(30), nullable=False, default="offline")
    promo_flag = Column(Boolean, nullable=False, default=False)
    return_quantity = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, nullable=False, server_default=func.now())

