const dotenv = require("dotenv");
dotenv.config();

module.exports = {
  whisperConfig: {
    model: "medium.en",
    modelDir: process.env.WHISPER_MODEL_PATH,
  },
  openAIConfig: {
    appendInitPrompt: `
    Summarise this text. To be used as a meeting report, so do not skip any important details.
    Do skip any non relevant pleasentries! Text to summarise: `,
    appendPrompt: `
    Summarise this text. To be used as a meeting report, so do not skip any important details.
    Do skip any non relevant pleasentries! This is a continuation of a summary,
    so no intro needed just keep on writing as you would be continuing from a prevous prompt.
    Meaning you do not use During the meeting or In this meeting report or something simmilar to begin
    the response with. Text to summarise: `,
  },
};
