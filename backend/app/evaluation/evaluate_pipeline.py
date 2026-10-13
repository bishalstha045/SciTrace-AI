import json
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

# Ensure backend root is in python path
backend_root = Path(__file__).resolve().parent.parent.parent
if str(backend_root) not in sys.path:
    sys.path.insert(0, str(backend_root))

from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    precision_recall_fscore_support,
)

from app.core.config import settings
from app.services.nli_service import nli_service
from app.services.similarity_service import similarity_service


def run_evaluation(
    dataset_path: Optional[Path] = None,
    output_results_path: Optional[Path] = None,
) -> Dict[str, Any]:
    """
    Evaluates the complete SciTrace AI semantic similarity and NLI contradiction detection pipeline
    against the curated version-controlled scientific benchmark dataset.
    """
    if dataset_path is None:
        dataset_path = backend_root / "data" / "evaluation_benchmark.json"

    if output_results_path is None:
        output_results_path = backend_root / "data" / "evaluation_results.json"

    with open(dataset_path, "r", encoding="utf-8") as f:
        benchmark_data: List[Dict[str, Any]] = json.load(f)

    labels_order = ["contradiction", "supporting", "neutral"]

    y_true: List[str] = []
    y_pred: List[str] = []
    pair_results: List[Dict[str, Any]] = []

    total_inference_time = 0.0

    print("=" * 75)
    print("SCITRACE AI — PIPELINE EVALUATION ON BENCHMARK DATASET")
    print(f"Dataset: {dataset_path} ({len(benchmark_data)} pairs)")
    print(f"Similarity Model: {settings.SIMILARITY_MODEL_NAME}")
    print(f"NLI Model: {settings.NLI_MODEL_NAME}")
    print(f"Thresholds: Contradiction >= {settings.NLI_CONTRADICTION_THRESHOLD:.2f}, Supporting >= {settings.NLI_SUPPORTING_THRESHOLD:.2f}")
    print("=" * 75)

    for item in benchmark_data:
        claim_a = item["claim_a"]
        claim_b = item["claim_b"]
        expected = item["ground_truth"]

        start_time = time.perf_counter()

        # 1. Real Semantic Similarity
        sim_score = similarity_service.compute_similarity(claim_a, claim_b)

        # 2. Real NLI Classification
        c1_dict = {"id": f"{item['id']}_a", "paper_id": "pA", "claim_text": claim_a, "page_number": 1}
        c2_dict = {"id": f"{item['id']}_b", "paper_id": "pB", "claim_text": claim_b, "page_number": 1}

        classification_res = nli_service.classify_claim_pair(
            analysis_id="eval_run",
            source_claim=c1_dict,
            target_claim=c2_dict,
            similarity_score=sim_score,
        )

        # Reverse direction check for asymmetry
        reverse_res = nli_service.classify_claim_pair(
            analysis_id="eval_run_rev",
            source_claim=c2_dict,
            target_claim=c1_dict,
            similarity_score=sim_score,
        )

        elapsed = time.perf_counter() - start_time
        total_inference_time += elapsed

        predicted = classification_res["classification"]
        if predicted not in labels_order:
            predicted = "neutral"

        y_true.append(expected)
        y_pred.append(predicted)

        pair_record = {
            "id": item["id"],
            "category": item["category"],
            "ground_truth": expected,
            "predicted": predicted,
            "is_correct": bool(expected == predicted),
            "similarity_score": round(float(sim_score), 4),
            "confidence_score": classification_res["confidence_score"],
            "nli_scores": classification_res["nli_scores"],
            "reverse_predicted": reverse_res["classification"],
            "symmetric_agreement": bool(predicted == reverse_res["classification"]),
            "latency_ms": round(elapsed * 1000, 2),
            "claim_a": claim_a,
            "claim_b": claim_b,
            "rationale": item.get("labelling_rationale", ""),
            "source_info": item.get("source_info", ""),
            "is_illustrative": item.get("is_illustrative", False),
        }
        pair_results.append(pair_record)

    # Compute Metrics using scikit-learn
    acc = float(accuracy_score(y_true, y_pred))
    micro_res = precision_recall_fscore_support(y_true, y_pred, average="micro", zero_division="warn")
    _p_micro, _r_micro, f1_micro = float(micro_res[0]), float(micro_res[1]), float(micro_res[2])
    macro_res = precision_recall_fscore_support(y_true, y_pred, average="macro", zero_division="warn")
    p_macro, r_macro, f1_macro = float(macro_res[0]), float(macro_res[1]), float(macro_res[2])

    cls_res: Any = precision_recall_fscore_support(y_true, y_pred, labels=labels_order, zero_division="warn")
    p_per_class = [float(v) for v in cls_res[0]]
    r_per_class = [float(v) for v in cls_res[1]]
    f1_per_class = [float(v) for v in cls_res[2]]
    support_per_class = [int(v) for v in cls_res[3]] if cls_res[3] is not None else [0] * len(labels_order)

    conf_mat = confusion_matrix(y_true, y_pred, labels=labels_order).tolist()
    _report_dict = classification_report(y_true, y_pred, labels=labels_order, output_dict=True, zero_division="warn")

    per_class_metrics = {}
    for i, label in enumerate(labels_order):
        per_class_metrics[label] = {
            "precision": round(p_per_class[i], 4),
            "recall": round(r_per_class[i], 4),
            "f1_score": round(f1_per_class[i], 4),
            "support": support_per_class[i],
        }

    # Count false positives & negatives
    misclassified = [p for p in pair_results if not p["is_correct"]]
    symmetric_agreements = sum(1 for p in pair_results if p["symmetric_agreement"])

    avg_latency_ms = (total_inference_time / len(benchmark_data)) * 1000

    results_summary = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "dataset_size": len(benchmark_data),
        "total_inference_time_sec": round(total_inference_time, 2),
        "avg_latency_per_pair_ms": round(avg_latency_ms, 2),
        "models": {
            "similarity_model": settings.SIMILARITY_MODEL_NAME,
            "nli_model": settings.NLI_MODEL_NAME,
            "similarity_threshold": settings.SIMILARITY_THRESHOLD,
            "contradiction_threshold": settings.NLI_CONTRADICTION_THRESHOLD,
            "supporting_threshold": settings.NLI_SUPPORTING_THRESHOLD,
        },
        "aggregate_metrics": {
            "accuracy": round(float(acc), 4),
            "macro_f1": round(float(f1_macro), 4),
            "macro_precision": round(float(p_macro), 4),
            "macro_recall": round(float(r_macro), 4),
            "micro_f1": round(float(f1_micro), 4),
        },
        "per_class_metrics": per_class_metrics,
        "confusion_matrix": {
            "labels": labels_order,
            "matrix": conf_mat,
        },
        "directional_invariance_rate": round(symmetric_agreements / len(benchmark_data), 4),
        "misclassified_count": len(misclassified),
        "misclassified_pairs": misclassified,
        "all_pair_results": pair_results,
    }

    # Save to JSON
    with open(output_results_path, "w", encoding="utf-8") as f:
        json.dump(results_summary, f, indent=2)

    # Print Formatted Report to stdout
    print(f"\nOverall Accuracy: {acc:.1%} ({len(benchmark_data) - len(misclassified)}/{len(benchmark_data)} correct)")
    print(f"Macro F1 Score:   {f1_macro:.3f}")
    print(f"Macro Precision:  {p_macro:.3f}")
    print(f"Macro Recall:     {r_macro:.3f}")
    print(f"Directional Symmetry Rate: {symmetric_agreements}/{len(benchmark_data)} ({symmetric_agreements/len(benchmark_data):.1%})")
    print(f"Avg Latency per Pair:      {avg_latency_ms:.1f} ms")
    print("\nPer-Class Breakdown:")
    for label in labels_order:
        m = per_class_metrics[label]
        print(f"  • {label.capitalize():<14}: Precision={m['precision']:.1%}, Recall={m['recall']:.1%}, F1={m['f1_score']:.3f} (n={m['support']})")

    print("\nConfusion Matrix (Rows: Ground Truth, Cols: Predicted):")
    print(f"{'':<16} {'Contradiction':<16} {'Supporting':<16} {'Neutral':<16}")
    for i, actual in enumerate(labels_order):
        row_str = f"{actual.capitalize():<16} " + " ".join(f"{conf_mat[i][j]:<16}" for j in range(len(labels_order)))
        print(row_str)

    if misclassified:
        print(f"\nMisclassified Pairs ({len(misclassified)}):")
        for m in misclassified:
            print(f"  [{m['id']}] Expected: {m['ground_truth']} | Pred: {m['predicted']} (sim={m['similarity_score']:.2f}, contra={m['nli_scores']['contradiction']:.2f}, ent={m['nli_scores']['entailment']:.2f})")
            print(f"      Category: {m['category']}")
            print(f"      Rationale: {m['rationale']}")
    else:
        print("\nAll benchmark pairs classified with 100% concordance!")

    print(f"\nSaved complete evaluation report to: {output_results_path}")
    print("=" * 75)

    return results_summary


if __name__ == "__main__":
    run_evaluation()
