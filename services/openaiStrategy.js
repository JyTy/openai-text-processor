const { chatSummarizev3 } = require("./strategies/summariseChatV3");

const strategies = {
  summary: chatSummarizev3,
};

async function generateSummary(inputText, proc) {
  if (!strategies[proc]) {
    console.error(`Invalid strategy: ${proc}`);
    return null;
  }

  return await strategies[proc](inputText);
}

module.exports = {
  generateSummary,
};
