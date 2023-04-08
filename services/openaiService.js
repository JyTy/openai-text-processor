const { Configuration, OpenAIApi } = require("openai");
const dotenv = require("dotenv");
const { splitTextIntoChunks } = require("../utils/textUtils");
dotenv.config();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

async function generateSummary(inputText) {
  const maxLength = 4000;
  const conversation = [
    {
      role: "system",
      content:
        "You are a helpful assistant that summarizes text in great detail.",
    },
  ];

  const textChunks = splitTextIntoChunks(inputText, maxLength);

  for (const chunk of textChunks) {
    conversation.push({ role: "user", content: chunk });
  }

  let summary = "";
  let isComplete = false;

  while (!isComplete) {
    conversation.push({
      role: "user",
      content:
        "Please provide a detailed summary of the entire text in key points. Be as detailed as possible in what was discussed and what were the agreements made. This summary will be used by the leadership to read what was discussed on the meeting and decide if any action need to be created out of it. Skip the pleasentries in the summary if any happened during the conversation.",
    });

    // log conversation length
    console.log("inputText length: ", inputText.length);
    console.log("conversation length: ", conversation.length);

    try {
      const response = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: conversation,
      });

      // console.log("response: ", response.data.choices);

      const assistantResponse = response.data.choices[0].message.content;
      summary += assistantResponse;

      // Check if the response contains a completion indicator.
      // You can change this condition depending on the indicator you want to use.
      if (assistantResponse.trim().endsWith(".")) {
        isComplete = true;
      } else {
        conversation.push({
          role: "user",
          content: "Please continue the summary.",
        });
      }
    } catch (error) {
      console.error("Error generating summary:", error);
      return null;
    }
  }

  return summary;
}

module.exports = {
  generateSummary,
};
