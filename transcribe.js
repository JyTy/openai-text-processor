const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs-extra");
const { Configuration, OpenAIApi } = require("openai");
const dotenv = require("dotenv");
const { splitTextIntoChunks } = require("./utils/textUtils");
const { generateSummary } = require("./services/openaiService");
const { transcribeAudio } = require("./services/transcriptionService");

dotenv.config();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

async function saveSummary(filePath, summary) {
  const summaryFilePath = path.join(
    path.dirname(filePath),
    path.basename(filePath, path.extname(filePath)) + "-summary.txt"
  );
  fs.writeFileSync(summaryFilePath, summary);
  console.log(`Summary saved at: ${summaryFilePath}`);
}

if (process.argv.length < 3) {
  console.error("Usage: node transcribe_local.js <audio_file_path>");
  process.exit(1);
}

const audioFilePath = process.argv[2];

transcribeAudio(audioFilePath)
  .then(async (outputFilePath) => {
    console.log(`Transcript saved at: ${outputFilePath}`);
    const transcription = fs.readFileSync(outputFilePath, "utf-8");
    console.log("Generating summary...");
    const summary = await generateSummary(transcription);
    if (summary) {
      await saveSummary(outputFilePath, summary);
    }
  })
  .catch((code) => {
    console.error(`Transcription process exited with code: ${code}`);
  });
