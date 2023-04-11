# openai-text-processor
Run with node transcribe.js <PATH-TO-AUDIO-FILE> --model=(optional) --proc=(optional)

--model options:
tiny.en,tiny,base.en,base,small.en,small,**medium.en (default)**,medium,large-v1,large-v2,large

--proc options:
**summary (default)**, vinchiSum

copy .env.example and rename it to .env and set your openai api key and path for your whisper models.

pre requirements:
- node
- whisper (+python): https://github.com/openai/whisper
- npm install
