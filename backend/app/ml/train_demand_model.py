from pathlib import Path
import joblib
import pandas as pd
from sqlalchemy import create_engine, text
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error
from sklearn.model_selection import train_test_split
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
MODEL_DIR = Path(__file__).resolve().parent / "models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)
MODEL_PATH = MODEL_DIR / "demand_model.joblib"


SQL = """
WITH daily_sales AS (
    SELECT
        sh.variant_id,
        sh.sale_date::date AS sale_date,
        SUM(sh.quantity) AS qty
    FROM sales_history sh
    GROUP BY sh.variant_id, sh.sale_date::date
),
base AS (
    SELECT
        pv.id AS variant_id,
        p.id AS product_id,
        d.name AS department_name,
        pv.current_stock,
        pv.reserved_stock,
        pv.safety_stock,
        pv.lead_time_days,
        pv.abc_class,
        pv.xyz_class,
        ds.sale_date,
        ds.qty
    FROM daily_sales ds
    JOIN product_variants pv ON pv.id = ds.variant_id
    JOIN products p ON p.id = pv.product_id
    JOIN departments d ON d.id = p.department_id
)
SELECT *
FROM base
ORDER BY variant_id, sale_date;
"""


def build_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["sale_date"] = pd.to_datetime(df["sale_date"])
    df = df.sort_values(["variant_id", "sale_date"])

    for lag in [1, 7, 14, 30]:
        df[f"lag_{lag}"] = df.groupby("variant_id")["qty"].shift(lag)

    df["rolling_mean_7"] = (
        df.groupby("variant_id")["qty"]
        .shift(1)
        .rolling(7)
        .mean()
        .reset_index(level=0, drop=True)
    )

    df["rolling_sum_7"] = (
        df.groupby("variant_id")["qty"]
        .shift(1)
        .rolling(7)
        .sum()
        .reset_index(level=0, drop=True)
    )

    df["rolling_sum_14"] = (
        df.groupby("variant_id")["qty"]
        .shift(1)
        .rolling(14)
        .sum()
        .reset_index(level=0, drop=True)
    )

    df["rolling_sum_30"] = (
        df.groupby("variant_id")["qty"]
        .shift(1)
        .rolling(30)
        .sum()
        .reset_index(level=0, drop=True)
    )

    future_7d = (
        df.groupby("variant_id")["qty"]
        .shift(-1)
        .rolling(7)
        .sum()
        .reset_index(level=0, drop=True)
    )
    df["target_7d"] = future_7d

    df["weekday"] = df["sale_date"].dt.weekday
    df["month"] = df["sale_date"].dt.month

    df["abc_class"] = df["abc_class"].fillna("C")
    df["xyz_class"] = df["xyz_class"].fillna("Z")

    df = pd.get_dummies(
        df,
        columns=["department_name", "abc_class", "xyz_class"],
        drop_first=False,
    )

    df = df.dropna()
    return df


def main():
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL not found in environment")

    engine = create_engine(DATABASE_URL)

    with engine.connect() as conn:
        df = pd.read_sql(text(SQL), conn)

    if df.empty:
        raise RuntimeError("No sales data found")

    df = build_features(df)

    feature_cols = [
        col for col in df.columns
        if col not in {"sale_date", "qty", "target_7d", "product_id"}
    ]

    X = df[feature_cols]
    y = df["target_7d"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, shuffle=False
    )

    model = RandomForestRegressor(
        n_estimators=200,
        max_depth=10,
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    mae = mean_absolute_error(y_test, preds)

    payload = {
        "model": model,
        "feature_cols": feature_cols,
        "mae": float(mae),
    }

    joblib.dump(payload, MODEL_PATH)
    print(f"Model saved to: {MODEL_PATH}")
    print(f"MAE: {mae:.4f}")


if __name__ == "__main__":
    main()