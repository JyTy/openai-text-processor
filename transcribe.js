const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs-extra");
const { Configuration, OpenAIApi } = require("openai");
const dotenv = require("dotenv");
dotenv.config();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// // temp code
// async function test() {
//   const conversation = [
//     {
//       role: "system",
//       content: "You are a helpful assistant that summarizes text.",
//     },
//   ];

//   conversation.push({
//     role: "user",
//     content:
//       "The API is powered by a set of models with different capabilities and price points. GPT-4 is our latest and most powerful model. GPT-3.5-Turbo is the model that powers ChatGPT and is optimized for conversational formats. To learn more about these models and what else we offer, visit our models documentation.",
//   });

//   conversation.push({
//     role: "user",
//     content: "Please summarize the entire text.",
//   });

//   try {
//     const response = await openai.createChatCompletion({
//       model: "gpt-3.5-turbo",
//       messages: conversation,
//     });

//     console.log("response: ", response.data.choices);
//   } catch (error) {
//     console.error("Error generating summary:", error);
//     return null;
//   }
// }

// // End of temp code

function splitTextIntoChunks(text, maxLength) {
  const words = text.split(" ");
  const chunks = [];
  let currentChunk = "";

  for (const word of words) {
    if (currentChunk.length + word.length + 1 <= maxLength) {
      currentChunk += (currentChunk ? " " : "") + word;
    } else {
      chunks.push(currentChunk);
      currentChunk = word;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

async function generateSummary(inputText) {
  const maxLength = 4097;
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

async function saveSummary(filePath, summary) {
  const summaryFilePath = path.join(
    path.dirname(filePath),
    path.basename(filePath, path.extname(filePath)) + "-summary.txt"
  );
  fs.writeFileSync(summaryFilePath, summary);
  console.log(`Summary saved at: ${summaryFilePath}`);
}

async function transcribeAudio(filePath) {
  //   // TEST CODE
  //   const transcription = fs.readFileSync(
  //     "audio/20230407-0934-meeting-recording.txt",
  //     "utf-8"
  //   );
  //   console.log("Generating summary...");
  //   const summary = await generateSummary(transcription);
  //   if (summary) {
  //     await saveSummary("audio/20230407-0934-meeting-recording.txt", summary);
  //   }
  //   // END OF TEST CODE

  const tempOutputFilePath = path.join(
    path.basename(filePath, path.extname(filePath)) + ".txt"
  );
  const outputFilePath = path.join(
    path.dirname(filePath),
    path.basename(filePath, path.extname(filePath)) + ".txt"
  );
  const command = "whisper";
  const args = [
    filePath,
    "--output_format",
    "txt",
    "--model",
    "medium.en",
    "--model_dir",
    process.env.WHISPER_MODEL_DIR,
  ];

  console.log("Starting transcription process...");

  const transcriptionProcess = spawn(command, args);

  transcriptionProcess.stdout.on("data", (data) => {
    process.stdout.write(data.toString());
  });

  transcriptionProcess.stderr.on("data", (data) => {
    process.stdout.write(data.toString());
  });

  transcriptionProcess.on("error", (error) => {
    console.error(`Error during transcription: ${error.message}`);
  });

  transcriptionProcess.on("close", async (code) => {
    if (code === 0) {
      await fs.move(tempOutputFilePath, outputFilePath, { overwrite: true });
      console.log(
        `Transcription completed successfully. Transcript saved at: ${outputFilePath}`
      );
      const transcription = fs.readFileSync(outputFilePath, "utf-8");
      console.log("Generating summary...");
      const summary = await generateSummary(transcription);
      if (summary) {
        await saveSummary(outputFilePath, summary);
      }
    } else {
      console.error(`Transcription process exited with code: ${code}`);
    }
  });
}

if (process.argv.length < 3) {
  console.error("Usage: node transcribe_local.js <audio_file_path>");
  process.exit(1);
}

const audioFilePath = process.argv[2];
transcribeAudio(audioFilePath);
