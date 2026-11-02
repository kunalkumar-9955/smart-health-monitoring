"""
train_model.py — AI Outbreak Risk Prediction Model
=====================================================
Loads health_data.csv, trains a Logistic Regression classifier,
evaluates it, and saves the model as model.pkl via joblib.
"""

import os
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
)
import joblib

# ── Paths ──────────────────────────────────────────────────────────────────
BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
CSV_PATH   = os.path.join(BASE_DIR, "health_data.csv")
MODEL_PATH = os.path.join(BASE_DIR, "model.pkl")

# ── Label maps ─────────────────────────────────────────────────────────────
# CSV already contains integer-encoded columns; these maps are for reference
# water_quality : good=0, moderate=1, bad=2
# season        : summer=0, monsoon=1, winter=2
# risk (target) : low=0, medium=1, high=2
RISK_LABELS = {0: "low", 1: "medium", 2: "high"}


def load_data(path: str) -> pd.DataFrame:
    if not os.path.exists(path):
        raise FileNotFoundError(f"Dataset not found at: {path}")
    df = pd.read_csv(path)
    required = {"cases", "water_quality", "season", "risk"}
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"CSV is missing columns: {missing}")
    df = df.dropna()
    print(f"[OK] Loaded {len(df)} records from {path}")
    return df


def train(df: pd.DataFrame):
    X = df[["cases", "water_quality", "season"]]
    y = df["risk"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    print(f"   Train: {len(X_train)} rows | Test: {len(X_test)} rows")

    # Pipeline: scale -> logistic regression
    pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("clf",    LogisticRegression(max_iter=1000, random_state=42,
                                     class_weight="balanced")),
    ])
    pipeline.fit(X_train, y_train)

    y_pred = pipeline.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)

    print(f"\n[ACCURACY] {accuracy * 100:.2f}%")
    print("\n[REPORT]")
    print(classification_report(y_test, y_pred,
                                target_names=["low", "medium", "high"]))
    print("[CONFUSION MATRIX]")
    print(confusion_matrix(y_test, y_pred))

    return pipeline


def save_model(pipeline, path: str):
    joblib.dump(pipeline, path)
    print(f"\n[SAVED] Model saved -> {path}")


if __name__ == "__main__":
    print("=" * 55)
    print("  Smart Health AI - Model Training Pipeline")
    print("=" * 55)

    df       = load_data(CSV_PATH)
    pipeline = train(df)
    save_model(pipeline, MODEL_PATH)

    print("\n[DONE] Run  python app.py  to start the prediction API.")
