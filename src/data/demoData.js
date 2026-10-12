export const demoAnalysis = {
  id: "demo-analysis",
  title: "Research Analysis - October 2026",
  status: "completed",
  progress: 100,
  isDemo: true,
  isSimulation: true,
  createdAt: "2026-10-07T10:00:00Z",
  updatedAt: "2026-10-07T10:05:00Z",
  papers: [
    {
      id: "paper-A",
      title: "Deep Learning for Medical Image Classification",
      authors: ["Smith", "Jones"],
      year: 2026,
      pages: 142,
      fileName: "Deep Learning for Medical Image Classification.pdf",
      status: "completed"
    },
    {
      id: "paper-B",
      title: "Comparative Study of Neural Classification Methods",
      authors: ["Williams", "Taylor"],
      year: 2025,
      pages: 96,
      fileName: "Comparative Study of Neural Classification Methods.pdf",
      status: "completed"
    },
    {
      id: "paper-C",
      title: "Evaluation of Modern Machine Learning Models",
      authors: ["Brown", "Davis"],
      year: 2026,
      pages: 118,
      fileName: "Evaluation of Modern Machine Learning Models.pdf",
      status: "completed"
    }
  ],
  claims: [
    // Paper A Claims
    { id: "claim-A1", paperId: "paper-A", text: "Method A significantly improves classification accuracy.", page: 7 },
    { id: "claim-A2", paperId: "paper-A", text: "The proposed model performs consistently across the evaluated datasets.", page: 11 },
    { id: "claim-A3", paperId: "paper-A", text: "Further experiments are required to evaluate generalization.", page: 14 },
    
    // Paper B Claims
    { id: "claim-B1", paperId: "paper-B", text: "No significant improvement was observed using Method A.", page: 12 },
    { id: "claim-B2", paperId: "paper-B", text: "Consistent performance was achieved across standard datasets.", page: 22 },
    
    // Paper C Claims
    { id: "claim-C1", paperId: "paper-C", text: "Model X shows higher performance in low-data settings.", page: 15 },
    { id: "claim-C2", paperId: "paper-C", text: "Model X does not outperform baselines in low-data settings.", page: 28 },
    { id: "claim-C3", paperId: "paper-C", text: "Training time increases exponentially with depth.", page: 40 }
  ],
  relationships: [
    {
      id: "rel-1",
      sourceClaimId: "claim-A1",
      targetClaimId: "claim-B1",
      type: "contradiction",
      confidence: 87,
      evidence: {
        source: {
          page: 7,
          text: "...Our experiments demonstrate that Method A significantly improves classification accuracy compared with the baseline approach. Specifically, we observe an average increase of 12.3% in accuracy across all test sets...",
          highlight: "Method A significantly improves classification accuracy"
        },
        target: {
          page: 12,
          text: "...In contrast, our results show that no significant improvement was observed using Method A. The classification accuracy remained comparable to the baseline model...",
          highlight: "no significant improvement was observed"
        }
      },
      contextDifferences: [
        "Different datasets referenced",
        "Different sample sizes",
        "Different evaluation metrics"
      ]
    },
    {
      id: "rel-2",
      sourceClaimId: "claim-C1",
      targetClaimId: "claim-C2",
      type: "contradiction",
      confidence: 76,
      evidence: {
        source: {
          page: 15,
          text: "...When evaluating constraints, Model X shows higher performance in low-data settings when pre-training is utilized...",
          highlight: "Model X shows higher performance in low-data settings"
        },
        target: {
          page: 28,
          text: "...However, under strict limitations, Model X does not outperform baselines in low-data settings without transfer learning...",
          highlight: "Model X does not outperform baselines in low-data settings"
        }
      },
      contextDifferences: [
        "Pre-training vs no pre-training",
        "Transfer learning application"
      ]
    },
    {
      id: "rel-3",
      sourceClaimId: "claim-A2",
      targetClaimId: "claim-B2",
      type: "supporting",
      confidence: 92,
      evidence: {
        source: {
          page: 11,
          text: "...The proposed model performs consistently across the evaluated datasets regardless of noise levels...",
          highlight: "performs consistently across the evaluated datasets"
        },
        target: {
          page: 22,
          text: "...Consistent performance was achieved across standard datasets, confirming previous findings...",
          highlight: "Consistent performance was achieved across standard datasets"
        }
      },
      contextDifferences: []
    },
    {
      id: "rel-4",
      sourceClaimId: "claim-A3",
      targetClaimId: "claim-C3",
      type: "neutral",
      confidence: 45,
      evidence: {
        source: {
          page: 14,
          text: "...Further experiments are required to evaluate generalization across unseen domains...",
          highlight: "Further experiments are required"
        },
        target: {
          page: 40,
          text: "...Training time increases exponentially with depth, making extensive generalization testing difficult...",
          highlight: "Training time increases exponentially"
        }
      },
      contextDifferences: []
    }
  ]
};

export const demoAnalysisData = demoAnalysis;
export default demoAnalysis;
