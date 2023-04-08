const { spawn } = require("child_process");
const fs = require("fs");

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

function countTokens(text) {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn("python", ["count_tokens.py"]);

    pythonProcess.stdin.write(text);
    pythonProcess.stdin.end();

    let tokenCount = "";

    pythonProcess.stdout.on("data", (data) => {
      tokenCount += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      console.error(`Error: ${data.toString()}`);
      reject(data.toString());
    });

    pythonProcess.on("close", (code) => {
      if (code !== 0) {
        reject(`Python process exited with code ${code}`);
      } else {
        resolve(parseInt(tokenCount.trim()));
      }
    });
  });
}

module.exports = {
  splitTextIntoChunks,
};
