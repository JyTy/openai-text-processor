const { splitTextIntoChunks } = require("../../utils/textUtils");
const { calculateCost } = require("../../utils/costUtils");
const { Configuration, OpenAIApi } = require("openai");
const openai = require("../openaiClient");

async function chatSummarizev3(inputText) {
  let summary = "";
  let finalSummary = "";
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

    console.log("\n--------------");
    console.log("processing chunk ", i + 1);
    console.log("chunk length: ", textChunks[i].length);

    // console.log("prompt: ", messages[0].content);
    // console.log("prompt: ", messages);

    const response = await createChatCompletion(messages, model);

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
    console.log("Total tokens used so far: ", tokensUsed);
  }

  if (textChunks.length > 1) {
    const secondPass = [
      {
        role: "system",
        content:
          "You are a helpful assistant that summarizes text in great detail.",
      },
      {
        role: "user",
        content:
          `
        I'm sending you the summary of a meeting that consists of several inconsistend pieces.
        I need you to rewrite this summary as a more cohesieve piece. Please make sure you keep
        all of the detail captured in the summary outtakes, leave nothing out. Also add a list
        of actions that need to be taken after based on the meeting summary and add it at the endof the summary text.
        Here are is the summary that needs polishing:` +
          "\n\n" +
          summary,
      },
    ];

    console.log("\n\n--------------");
    console.log("processing final pass");
    // const response = await createChatCompletion(secondPass, model);

    let isComplete = false;
    let maxIterations = 5;
    let currentIteration = 0;
    while (!isComplete && currentIteration < maxIterations) {
      // console.log("secondPass: ", secondPass);
      const response = await createChatCompletion(secondPass, model);

      finalSummary += response.data.choices[0].message.content;
      // console.log("response: ", response.data);

      console.log("Response token usage: ", response.data.usage);

      // Check if the response contains a completion indicator.
      // You can change this condition depending on the indicator you want to use.
      if (response.data.choices[0].finish_reason === "stop") {
        isComplete = true;
      } else {
        console.log(
          "To long response for a single request, continuing with next pass"
        );
        secondPass.push({
          role: "user",
          content:
            "Please continue summarizing the text from where you left off.",
        });
      }

      tokensUsed += response.data.usage.total_tokens;
      console.log("Total tokens used so far: ", tokensUsed);
      currentIteration++;
    }

    // Replace the summary with the final pass if enoug tokens to do a full response,
    // otherwise just return the unpolished summary
    // if (response.data.choices.finish_reason === "stop") {
    //   summary = response.data.choices[0].message.content;
    // } else {
    //   console.log(
    //     "Not enough tokens to do final pass, returning unpolished summary"
    //   );
    // }
  }

  calculateCost(tokensUsed, model);

  return finalSummary;
}

async function createChatCompletion(messages, model) {
  try {
    const response = await openai.createChatCompletion({
      model: model,
      messages: messages,
      temperature: 0.2,
    });

    // console.log(response.data);

    return response;
  } catch (error) {
    if (error.response && error.response.status === 429) {
      console.error(
        `Rate limit hit. Limit: ${error.response.headers["x-ratelimit-limit"]}, Remaining: ${error.response.headers["x-ratelimit-remaining"]}, Reset: ${error.response.headers["x-ratelimit-reset"]}`
      );
      process.exit(1);
    } else {
      console.error("Error generating summary:", error);
      return null;
    }
  }
}

module.exports = {
  chatSummarizev3,
};
