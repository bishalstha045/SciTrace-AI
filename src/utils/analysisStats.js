export function getAnalysisStats(analysis) {
  if (!analysis) {
    return {
      paperCount: 0,
      totalClaims: 0,
      totalRelationships: 0,
      supporting: [],
      contradictions: [],
      neutral: [],
      distinctPages: []
    };
  }

  const paperCount = analysis.papers?.length || 0;
  const rawClaims = (analysis.claims || []).map(c => ({
    ...c,
    id: c.id,
    text: c.claim_text || c.text || '',
    claim_text: c.claim_text || c.text || '',
    page: c.page_number || c.page || 1,
    page_number: c.page_number || c.page || 1,
    paperId: c.paper_id || c.paperId || '',
    paper_id: c.paper_id || c.paperId || '',
    section: c.section_name || c.section || '',
    section_name: c.section_name || c.section || '',
  }));
  const totalClaims = rawClaims.length;

  const relationships = (analysis.relationships || []).map(r => ({
    ...r,
    type: r.classification || r.type || 'related',
    classification: r.classification || r.type || 'related',
    sourceClaimId: r.source_claim_id || r.sourceClaimId,
    targetClaimId: r.target_claim_id || r.targetClaimId,
  }));
  
  const supporting = relationships.filter(r => r.type === 'supporting');
  const contradictions = relationships.filter(r => r.type === 'contradiction');
  const neutral = relationships.filter(r => r.type === 'neutral' || r.type === 'related');

  const distinctPages = [...new Set(rawClaims.map(c => c.page))].filter(Boolean).sort((a,b)=>a-b);

  return {
    paperCount,
    totalClaims,
    claims: rawClaims,
    relationships,
    totalRelationships: relationships.length,
    supporting,
    contradictions,
    neutral,
    distinctPages
  };
}

export function getPaperStats(analysis, paperId) {
  if (!analysis || !paperId) return null;

  const paper = analysis.papers?.find(p => p.id === paperId);
  if (!paper) return null;

  const rawClaims = (analysis.claims || []).map(c => ({
    ...c,
    id: c.id,
    text: c.claim_text || c.text || '',
    claim_text: c.claim_text || c.text || '',
    page: c.page_number || c.page || 1,
    page_number: c.page_number || c.page || 1,
    paperId: c.paper_id || c.paperId || '',
    paper_id: c.paper_id || c.paperId || '',
    section: c.section_name || c.section || '',
    section_name: c.section_name || c.section || '',
  }));

  const paperClaims = rawClaims.filter(c => c.paperId === paperId);
  
  const paperRelationships = (analysis.relationships || []).map(r => ({
    ...r,
    type: r.classification || r.type || 'related',
    classification: r.classification || r.type || 'related',
    sourceClaimId: r.source_claim_id || r.sourceClaimId,
    targetClaimId: r.target_claim_id || r.targetClaimId,
  })).filter(r => {
    const sClaim = rawClaims.find(c => c.id === r.sourceClaimId);
    const tClaim = rawClaims.find(c => c.id === r.targetClaimId);
    return sClaim?.paperId === paperId || tClaim?.paperId === paperId;
  });

  const supporting = paperRelationships.filter(r => r.type === 'supporting');
  const contradictions = paperRelationships.filter(r => r.type === 'contradiction');
  const neutral = paperRelationships.filter(r => r.type === 'neutral' || r.type === 'related');

  const distinctPages = [...new Set(paperClaims.map(c => c.page))].filter(Boolean).sort((a,b)=>a-b);

  return {
    paper,
    paperClaims,
    paperRelationships,
    supporting,
    contradictions,
    neutral,
    distinctPages
  };
}
