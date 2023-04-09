const { splitTextIntoChunks } = require("../../utils/textUtils");
const { calculateCost } = require("../../utils/costUtils");
const { Configuration, OpenAIApi } = require("openai");
const openai = require("../openaiClient");

async function chatSummarizev3(inputText) {
  let summary = "";
  const model = "gpt-3.5-turbo";
  let tokensUsed = 0;
  const maxLength = 12000; // experimental apparently this needs to be counted by tiktoken... pyton scrypt ready and utill added but not implemented

  const initConversation = [
    {
      role: "system",
      content:
        "You are a helpful assistant that summarizes text in great detail.",
    },
    {
      role: "user",
      content: `
        Summarise this text. To be used as a meeting report, so do not skip any important details.
        Do skip any non relevant pleasentries! Text to summarise: `,
    },
  ];

  const textChunks = splitTextIntoChunks(inputText, maxLength);
  console.log("textChunks: ", textChunks.length);

  let assistantResponse;

  // TODO: build different prompts for different types of content (meeitng summaries, podcast summaries ...)
  for (let i = 0; i < textChunks.length; i++) {
    let messages;
    if (!assistantResponse) {
      messages = [...initConversation];
      messages.push({ role: "user", content: textChunks[i] });
    } else {
      let referenceSummary = `
          This is a continuation of a summary that I need to do in text chunks because of the max_token
          api limit. This is the summary of the previous chunk of text:
          `;
      referenceSummary += "\n\n" + assistantResponse;
      referenceSummary +=
        "\n\n" +
        `
          --- Summary ends here. Do not do anything with this block of text, do not include it in the summary.
          This is here just for your refference so you can continue in a meaningfull way with the new block.
          I will add next text I need you to summarise in the next message!
          `;

      let summary = `
        This is a continuation of a summary, start with a new sentence but then just keep on writing as you would be continuing from
        a prevous summary that you can reference in the previous message. Meaning you do not use During the meeting or In this meeting report or something simmilar
        to begin the response with. Summarise the text below (but reference the summary in previous text to continue in a meaningful way).
        To be used as a meeting report, so do not skip any important details. Do skip any non relevant pleasentries!
        Text to summarise: `;
      summary += "\n\n" + textChunks[i];
      summary +=
        "\n\n" +
        `If any action were agreed that will need to be taken after the meeting add them as a list at the end of this
          summary. Otherwise skip this step and do not add anything.`;

      messages = [
        {
          role: "user",
          content: referenceSummary,
        },
        {
          role: "user",
          content: summary,
        },
      ];
    }

    console.log("processing chunk ", i + 1);
    console.log("chunk length: ", textChunks[i].length);

    // console.log("prompt: ", messages[0].content);
    // console.log("prompt: ", messages);

    try {
      const response = await openai.createChatCompletion({
        model: model,
        messages: messages,
      });

      //   summary +=
      //     "\n\n" +
      //     "ORIGINAL PROMPT: " +
      //     textChunks[i] +
      //     "\n\n" +
      //     "SUMMARY: " +
      //     "\n\n";

      assistantResponse = response.data.choices[0].message.content;
      //   console.log("response: ", assistantResponse);
      // console.log("response: ", response.data);

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
  chatSummarizev3,
};
