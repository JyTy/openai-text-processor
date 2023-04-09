const dotenv = require("dotenv");
dotenv.config();

module.exports = {
  whisperConfig: {
    modelDir: process.env.WHISPER_MODEL_PATH,
  },
};
