// Backend/controllers/places/ai/summaryAi.mock.js
export const getAiPlaceSummaryMock = async ({ place }) => {
  return {
    summary: {
      overallSentiment: "mixed",
      peopleLove: ["scenic views", "local culture"],
      peopleDislike: ["crowds during peak season"],
      bestFor: ["first-time travelers", "group trips"],
      avoidIf: ["you dislike crowds"],
      foodConsensus: ["street food preferred"],
      hiddenGems: ["less crowded neighborhoods"],
      touristTraps: ["overpriced tourist shops"],
      safetyNotes: ["beware of scams in crowded areas"],
    },
    confidenceScore: 0.3,
    sources: {
      aiProvider: "mock",
    },
  };
};
