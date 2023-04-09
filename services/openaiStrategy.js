const { chatSummarizev3 } = require("./strategies/summariseChatV3");
const { vinchiSumv003 } = require("./strategies/summariseVinchi003");

const strategies = {
  summary: chatSummarizev3,
  vinchiSum: vinchiSumv003,
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
