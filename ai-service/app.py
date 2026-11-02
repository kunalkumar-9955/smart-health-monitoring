"""
app.py — Smart Health AI Prediction API
=========================================
Flask microservice that loads model.pkl and exposes:

  POST /predict   → { risk, confidence, risk_numeric }
  GET  /health    → { status, model_loaded }
"""

import os
import traceback

import joblib
import numpy as np
from flask import Flask, jsonify, request
from flask_cors import CORS

# ── App setup ──────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app)

# ── Load model ─────────────────────────────────────────────────────────────
BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model.pkl")

model = None
try:
    model = joblib.load(MODEL_PATH)
    print(f"[OK] Model loaded from {MODEL_PATH}")
except FileNotFoundError:
    print("[WARN] model.pkl not found -- run train_model.py first!")
except Exception as exc:
    print(f"[ERROR] Failed to load model: {exc}")

# ── Label maps ─────────────────────────────────────────────────────────────
INT_TO_RISK = {0: "LOW", 1: "MEDIUM", 2: "HIGH"}


# ── Helpers ────────────────────────────────────────────────────────────────
def validate_input(data: dict):
    """Return (cases, water_quality, season) or raise ValueError."""
    errors = []

    for field in ("cases", "water_quality", "season"):
        if field not in data:
            errors.append(f"'{field}' is required")

    if errors:
        raise ValueError(", ".join(errors))

    cases         = int(data["cases"])
    water_quality = int(data["water_quality"])
    season        = int(data["season"])

    if cases < 0:
        raise ValueError("'cases' must be a non-negative integer")
    if water_quality not in (0, 1, 2):
        raise ValueError("'water_quality' must be 0 (good), 1 (moderate), or 2 (bad)")
    if season not in (0, 1, 2):
        raise ValueError("'season' must be 0 (summer), 1 (monsoon), or 2 (winter)")

    return cases, water_quality, season


# ── Routes ─────────────────────────────────────────────────────────────────
@app.route("/predict", methods=["POST"])
def predict():
    if model is None:
        return jsonify({"error": "Model not loaded. Run train_model.py first."}), 503

    try:
        data = request.get_json(force=True, silent=True)
        if not data:
            return jsonify({"error": "Request body must be JSON"}), 400

        cases, water_quality, season = validate_input(data)

        features     = np.array([[cases, water_quality, season]])
        risk_numeric = int(model.predict(features)[0])
        proba        = model.predict_proba(features)[0]
        confidence   = round(float(proba[risk_numeric]) * 100, 2)
        risk_label   = INT_TO_RISK[risk_numeric]

        return jsonify({
            "risk":          risk_label,          # "LOW" | "MEDIUM" | "HIGH"
            "risk_numeric":  risk_numeric,         # 0 | 1 | 2
            "confidence":    confidence,           # e.g. 87.34
        })

    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception:
        traceback.print_exc()
        return jsonify({"error": "Internal server error"}), 500


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status":       "healthy",
        "model_loaded": model is not None,
    })


# ── Entry point ────────────────────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.environ.get("AI_PORT", 5001))
    print(f"[START] AI service running on http://localhost:{port}")
    app.run(host="0.0.0.0", port=port, debug=False)
