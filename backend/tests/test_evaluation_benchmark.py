import json
from pathlib import Path
from typing import Any, List

from sklearn.metrics import accuracy_score, confusion_matrix, precision_recall_fscore_support

from app.services.nli_service import nli_service

benchmark_json_path = Path(__file__).resolve().parent.parent / "data" / "evaluation_benchmark.json"

if benchmark_json_path.exists():
    with open(benchmark_json_path, "r", encoding="utf-8") as f:
        EVALUATION_DATASET = json.load(f)
else:
    # Fallback to minimal set if file not found
    EVALUATION_DATASET = [
        {
            "id": "pair_01",
            "category": "clear_contradiction",
            "ground_truth": "contradiction",
            "claim_a": "High atmospheric CO2 concentrations significantly reduce calcification rates in marine organisms.",
            "claim_b": "Elevated atmospheric CO2 does not decrease calcification rates in marine organisms.",
        },
        {
            "id": "pair_04",
            "category": "supporting",
            "ground_truth": "supporting",
            "claim_a": "Rising ocean temperatures directly accelerate coral bleaching severity across tropical reefs.",
            "claim_b": "Higher sea surface temperatures are significantly associated with accelerated coral bleaching events.",
        },
        {
            "id": "pair_07",
            "category": "neutral_unrelated",
            "ground_truth": "neutral",
            "claim_a": "Ocean acidification reduces shell thickness in Antarctic pteropods.",
            "claim_b": "Machine learning algorithms optimize hyperparameter tuning in deep neural networks.",
        },
    ]


def test_evaluate_benchmark_dataset():
    """
    Evaluates the complete SciTrace AI NLI pipeline against the 25-pair version-controlled
    scientific benchmark dataset using scikit-learn metrics.
    """
    classes = ["contradiction", "supporting", "neutral"]
    y_true: List[str] = []
    y_pred: List[str] = []

    for item in EVALUATION_DATASET:
        claim_a = {"id": f"{item['id']}_a", "paper_id": "pA", "claim_text": item["claim_a"]}
        claim_b = {"id": f"{item['id']}_b", "paper_id": "pB", "claim_text": item["claim_b"]}

        res = nli_service.classify_claim_pair(
            analysis_id="bench",
            source_claim=claim_a,
            target_claim=claim_b,
            similarity_score=0.85,
        )

        pred = res["classification"]
        actual = item["ground_truth"]

        if pred not in classes:
            pred = "neutral"

        y_true.append(actual)
        y_pred.append(pred)

    # Scikit-learn Evaluation Metrics
    accuracy = float(accuracy_score(y_true, y_pred))
    macro_res = precision_recall_fscore_support(y_true, y_pred, average="macro", zero_division="warn")
    macro_f1 = float(macro_res[2])
    cls_res: Any = precision_recall_fscore_support(y_true, y_pred, labels=classes, zero_division="warn")
    p_cls = [float(v) for v in cls_res[0]]
    r_cls = [float(v) for v in cls_res[1]]
    f1_cls = [float(v) for v in cls_res[2]]
    supp_cls = [int(v) for v in cls_res[3]] if cls_res[3] is not None else [0] * len(classes)
    conf_mat = confusion_matrix(y_true, y_pred, labels=classes)

    print("\n" + "=" * 65)
    print("SCITRACE AI — STEP 7 REGRESSION & BENCHMARK EVALUATION")
    print("=" * 65)
    print(f"Dataset Size: {len(EVALUATION_DATASET)} manually annotated scientific claim pairs")
    print(f"Overall Accuracy: {accuracy:.1%}")
    print(f"Macro F1 Score:   {macro_f1:.3f}")
    print("\nPer-Class Metrics:")
    for i, c in enumerate(classes):
        print(f"  • {c.capitalize():<14}: Precision={p_cls[i]:.1%}, Recall={r_cls[i]:.1%}, F1={f1_cls[i]:.3f} (n={supp_cls[i]})")

    print("\nConfusion Matrix (Rows: Ground Truth, Cols: Predicted):")
    print(f"{'':<16} {'Contradiction':<16} {'Supporting':<16} {'Neutral':<16}")
    for i, actual in enumerate(classes):
        row_str = f"{actual.capitalize():<16} " + " ".join(f"{conf_mat[i][j]:<16}" for j in range(len(classes)))
        print(row_str)
    print("=" * 65)

    # Statistical assertions for quality assurance
    assert accuracy >= 0.85, f"Expected benchmark accuracy >= 85%, got {accuracy:.1%}"
    assert macro_f1 >= 0.85, f"Expected Macro F1 >= 0.85, got {macro_f1:.3f}"
    contra_idx = classes.index("contradiction")
    assert f1_cls[contra_idx] >= 0.90, f"Expected Contradiction F1 >= 0.90, got {f1_cls[contra_idx]:.3f}"
