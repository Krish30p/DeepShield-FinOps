export const verifyProvenance = async (ticker, context) => {
  // Mock SEC Edgar Search Skill
  // For the hackathon, we simulate that context mentioning "deepfake" or lacking strict SEC details returns empty.
  // Otherwise, returns a valid SEC URL.
  
  if (context.toLowerCase().includes("deepfake")) {
    return ""; // Provenance verification fails
  }

  // Simulate returning a real SEC EDGAR URL
  return `https://www.sec.gov/Archives/edgar/data/12345/000123/mock_${ticker.toLowerCase()}_filing.htm`;
};
