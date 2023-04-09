const { splitTextIntoChunks } = require("../../utils/textUtils");
const { calculateCost } = require("../../utils/costUtils");
const { Configuration, OpenAIApi } = require("openai");
const openai = require("../openaiClient");

async function vinchiSumv003(inputText) {
  let tokensUsed = 0;
  const model = "text-davinci-003";
  let summary = "";
  const maxLength = 8000; // experimental apparently this needs to be counted by tiktoken... pyton scrypt ready and utill added but not implemented

  const textChunks = splitTextIntoChunks(inputText, maxLength);
  console.log("textChunks: ", textChunks.length);

  let assistantResponse;

  // TODO: build different prompts for different types of content (meeitng summaries, podcast summaries ...)
  for (let i = 0; i < textChunks.length; i++) {
    let prompt =
      `Please provide a concise summary of the following text but keep in mind that your response SHOULD NOT include any direct quotes or sentences from the original text you were asked to summarise! Text to summarise: ` +
      "\n\n" +
      textChunks[i];

    console.log("processing chunk ", i + 1);
    console.log("chunk length: ", textChunks[i].length);

    // console.log("prompt: ", messages[0].content);
    // console.log("prompt: ", messages);

    // console.log("prompt: ", prompt);

    try {
      const response = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: prompt,
        max_tokens: 2000,
      });

      assistantResponse = response.data.choices[0].text;
      // console.log("response: ", response.data);
      //   console.log("response: ", assistantResponse);

      if (i > 0) {
        summary += "\n\n";
      }

      summary += assistantResponse;
      tokensUsed += response.data.usage.total_tokens;
    } catch (error) {
      console.error("Error generating summary:", error);
      return null;
    }
  }

  calculateCost(tokensUsed, model);

  return summary;
}

module.exports = {
  vinchiSumv003,
};
