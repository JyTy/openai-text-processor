function getModelCostPerToken(model) {
  // pricing: https://openai.com/pricing
  const modelPricing = {
    "gpt-3.5-turbo": 0.002 / 1000,
    "text-davinci-002": 0.02 / 1000,
    "text-davinci-003": 0.02 / 1000,
  };

  return modelPricing[model];
}

function calculateCost(totalTokensUsed, model) {
  const costPerToken = getModelCostPerToken(model);

  if (!costPerToken) {
    console.error(`Cost per token for model ${model} not found.`);
    return null;
  }

  const cost = totalTokensUsed * costPerToken;
  console.log(`Aproximate cost of the API call for model ${model}: $${cost}`);

  return cost;
}

module.exports = {
  calculateCost,
};
