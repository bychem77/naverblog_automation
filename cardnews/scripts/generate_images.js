#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const [, , jsonArg, outputArg] = process.argv;
if (!jsonArg || !outputArg) {
  console.error('Usage: node scripts/generate_images.js <cards.json> <output-directory>');
  process.exit(1);
}

const jsonPath = path.resolve(jsonArg);
const outputDir = path.resolve(outputArg);
const imageDir = path.join(outputDir, 'images');
const templateDir = path.resolve(__dirname, '../templates');
const manualRoot = path.resolve(process.env.CARDNEWS_MANUAL_IMAGE_ROOT || path.resolve(__dirname, '../assets/manual'));
const apiKey = process.env.OPENAI_API_KEY?.trim();
const model = process.env.OPENAI_IMAGE_MODEL?.trim() || 'gpt-image-2';
const quality = process.env.OPENAI_IMAGE_QUALITY?.trim() || 'medium';
const size = process.env.OPENAI_IMAGE_SIZE?.trim() || '1024x1536';
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

if (!data.cover?.image_prompt || !Array.isArray(data.slides) || !data.outro) {
  throw new Error(`Missing image prompts in ${jsonPath}`);
}

const sharedDirection = [
  'Create a full-bleed background image for a BYCHEM Korean B2B card-news template.',
  'The final card is 4:5 portrait; compose for a centered 4:5 crop from the generated portrait image.',
  'Keep important subjects away from the outer edges and leave the lower 40 percent visually calm for overlaid Korean copy.',
  'Use bright, realistic commercial editorial photography or polished realistic 3D CGI with clean materials.',
  'Do not include any text, letters, numbers, logo, watermark, identifiable company, branded product, real employee, accident, fire, spill, exposed hazardous material, dark sci-fi, or sensational imagery.'
].join(' ');

const variations = [
  'Use a warm-white and copper accent palette with a close editorial camera angle.',
  'Use a graphite and teal accent palette with a clean technical macro composition.',
  'Use a soft green and neutral-gray palette with a wider process-focused composition.',
  'Use restrained orange and cool-white accents with a precise overhead or three-quarter composition.',
  'Use a pale cyan and warm metallic palette with shallow depth of field.',
  'Use natural neutral colors with a clean symmetrical industrial composition.'
];

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function templateRelative(filePath) {
  const relative = path.relative(templateDir, filePath).split(path.sep).join('/');
  return relative.startsWith('.') ? relative : `./${relative}`;
}

function findManualImage(directory, stem) {
  for (const extension of ['.png', '.jpg', '.jpeg', '.webp']) {
    const candidate = path.join(directory, `${stem}${extension}`);
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  return null;
}

async function requestImage(prompt) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ model, prompt, size, quality, output_format: 'png' }),
        signal: AbortSignal.timeout(240_000)
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        const message = payload.error?.message || `OpenAI API returned HTTP ${response.status}`;
        const error = new Error(message);
        error.retryable = response.status === 429 || response.status >= 500;
        throw error;
      }

      const payload = await response.json();
      const base64 = payload.data?.[0]?.b64_json;
      if (!base64) throw new Error('OpenAI API returned no image data');
      return Buffer.from(base64, 'base64');
    } catch (error) {
      lastError = error;
      if (attempt === 3 || error.retryable === false) break;
      await sleep(attempt * 5_000);
    }
  }
  throw lastError;
}

async function generate(job) {
  try {
    const bytes = await requestImage(`${sharedDirection} ${job.direction} ${job.prompt}`);
    fs.writeFileSync(job.apiFilePath, bytes, { mode: 0o600 });
    job.card.background = templateRelative(job.apiFilePath);
    console.log(`Generated ${path.basename(job.apiFilePath)}`);
    return true;
  } catch (error) {
    console.warn(`Image generation failed for ${job.label}; keeping its placeholder background. ${error.message}`);
    return false;
  }
}

async function main() {
  const sourceName = path.basename(data.source_md || path.basename(jsonPath), path.extname(data.source_md || jsonPath));
  const manualDir = path.join(manualRoot, sourceName);

  const jobs = [
    {
      label: 'cover',
      card: data.cover,
      prompt: data.cover.image_prompt,
      direction: 'Use one strong topic-specific hero subject and a premium, clean composition.',
      manualStem: 'cover',
      apiFilePath: path.join(imageDir, 'cover.png')
    },
    ...data.slides.map((slide, index) => ({
      label: `content ${index + 1}`,
      card: slide,
      prompt: slide.image_prompt,
      direction: variations[index % variations.length],
      manualStem: `content_${String(index + 1).padStart(2, '0')}`,
      apiFilePath: path.join(imageDir, `content_${String(index + 1).padStart(2, '0')}.png`)
    }))
  ];

  let manualCount = 0;
  const pending = [];
  for (const job of jobs) {
    const manualPath = findManualImage(manualDir, job.manualStem);
    if (manualPath) {
      job.card.background = templateRelative(manualPath);
      manualCount += 1;
      console.log(`Using manual image ${path.basename(manualPath)}`);
    } else {
      pending.push(job);
    }
  }

  const apiResults = [];
  if (apiKey && pending.length) {
    fs.mkdirSync(imageDir, { recursive: true });
    for (const job of pending) apiResults.push(await generate(job));
  } else if (pending.length) {
    console.log('OPENAI_API_KEY is not configured; missing manual images will use placeholder backgrounds.');
  }

  const apiCount = apiResults.filter(Boolean).length;
  const placeholderCount = jobs.length - manualCount - apiCount;

  data.outro.background = data.cover.background;
  data.outro.same_background_as = 'cover';
  data.metadata = {
    ...data.metadata,
    image_sources: {
      manual: manualCount,
      openai: apiCount,
      placeholders: placeholderCount,
      total: jobs.length,
      model,
      size,
      quality
    }
  };

  fs.writeFileSync(jsonPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  console.log(`Image preparation complete: ${manualCount} manual, ${apiCount} OpenAI, ${placeholderCount} placeholder.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
