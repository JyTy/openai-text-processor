const { Configuration, OpenAIApi } = require("openai");
const dotenv = require("dotenv");
const { splitTextIntoChunks } = require("../utils/textUtils");
const { openAIConfig } = require("../config");

dotenv.config();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

async function generateSummary(inputText) {
  const maxLength = 10000; // experimental apparently this needs to be counted by tiktoken... pyton scrypt ready and utill added but not implemented

  const initConversation = [
    {
      role: "system",
      content:
        "You are a helpful assistant that summarizes text in great detail.",
    },
    {
      role: "user",
      content: openAIConfig.appendInitPrompt,
    },
  ];

  // by removin gthe system role the system obeys the prompt more and the response really feels like the continuation of the summary.
  const conversation = [
    // {
    //   role: "system",
    //   content:
    //     "You are a helpful assistant that summarizes text in great detail.",
    // },
    {
      role: "user",
      content: openAIConfig.appendPrompt,
    },
  ];

  const contentLengt = conversation.reduce(
    (accumulator, content) => accumulator + content.content.length,
    0
  );

  const textChunks = splitTextIntoChunks(inputText, maxLength - contentLengt);
  console.log("textChunks: ", textChunks.length);

  let summary = "";

  for (let i = 0; i < textChunks.length; i++) {
    let messages;
    if (i === 0) {
      messages = [...initConversation];
    } else {
      messages = [...conversation];
    }

    messages.push({ role: "user", content: textChunks[i] });

    console.log("processing chunk ", i + 1);
    console.log("chunk length: ", textChunks[i].length);

    // console.log("prompt: ", messages[1].content);

    try {
      const response = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: messages,
      });

      //   summary +=
      //     "\n\n" +
      //     "ORIGINAL PROMPT: " +
      //     textChunks[i] +
      //     "\n\n" +
      //     "SUMMARY: " +
      //     "\n\n";

      const assistantResponse = response.data.choices[0].message.content;

      console.log("response: ", response.data);
      if (i > 0) {
        summary += "\n\n";
      }

      summary += assistantResponse;
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
