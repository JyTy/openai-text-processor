const path = require("path");
const fs = require("fs-extra");
const { Configuration, OpenAIApi } = require("openai");
const dotenv = require("dotenv");
const { generateSummary } = require("./services/openaiService");
const { transcribeAudio } = require("./services/transcriptionService");
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");

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

const argv = yargs(hideBin(process.argv))
  .usage("Usage: $0 <audio_file_path> [options]")
  .demandCommand(1, "An audio file path is required")
  .option("langModel", {
    alias: "l",
    describe: "Language model",
    type: "string",
    default: "medium.en",
  })
  .option("proc", {
    alias: "p",
    describe: "Processing type",
    type: "string",
    default: "summary",
  })
  .help().argv;

const audioFilePath = argv._[0];
const langModel = argv.langModel;
const proc = argv.proc;

// process.exit(1);

transcribeAudio(audioFilePath, langModel)
  .then(async (outputFilePath) => {
    console.log(`Transcript saved at: ${outputFilePath}`);
    const transcription = fs.readFileSync(outputFilePath, "utf-8");
    console.log("Generating summary...");
    const summary = await generateSummary(transcription, proc);
    if (summary) {
      await saveSummary(outputFilePath, summary);
    }
  })
  .catch((code) => {
    console.error(`Transcription process exited with code: ${code}`);
  });
