const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs-extra");
const { whisperConfig } = require("../config");

async function transcribeAudio(filePath) {
  return new Promise(async (resolve, reject) => {
    // resolve("audio/20230407-1307-bof-tech-vision.txt");

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
      whisperConfig.model,
      "--model_dir",
      whisperConfig.modelDir,
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
        resolve(outputFilePath);
      } else {
        console.error(`Transcription process exited with code: ${code}`);
        reject(code);
      }
    });
  });
}

module.exports = {
  transcribeAudio,
};
