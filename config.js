const dotenv = require("dotenv");
dotenv.config();

module.exports = {
  whisperConfig: {
    model: "tiny.en",
    modelDir: process.env.WHISPER_MODEL_PATH,
  },
};
