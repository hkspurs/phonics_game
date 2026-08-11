const fs = require('fs');
const path = require('path');

const FISH_MODEL = 's2.1-pro-free';
const FISH_REFERENCE_ID = process.env.FISH_REFERENCE_ID || '1e39b1998ce842c6b5ffcfd9be6a5456';

function buildFishRequest(text, { speed = 0.8, referenceId = FISH_REFERENCE_ID } = {}) {
  return {
    text: String(text),
    reference_id: referenceId,
    format: 'wav',
    sample_rate: 24000,
    normalize: true,
    prosody: {
      speed,
      volume: 0,
      normalize_loudness: true,
    },
  };
}

async function requestFishAudio(text, output, options = {}) {
  if (!process.env.FISH_API_KEY) {
    throw new Error('FISH_API_KEY is required for Fish Audio generation.');
  }

  const request = buildFishRequest(text, options);
  let response;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    response = await fetch('https://api.fish.audio/v1/tts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.FISH_API_KEY}`,
        'Content-Type': 'application/json',
        model: FISH_MODEL,
      },
      body: JSON.stringify(request),
    });

    if (response.ok) break;
    if (![429, 500, 502, 503, 504].includes(response.status) || attempt === 3) {
      const message = (await response.text()).slice(0, 240);
      throw new Error(`Fish Audio HTTP ${response.status}: ${message}`);
    }
    await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
  }

  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, Buffer.from(await response.arrayBuffer()));
}

module.exports = {
  FISH_MODEL,
  FISH_REFERENCE_ID,
  buildFishRequest,
  requestFishAudio,
};
