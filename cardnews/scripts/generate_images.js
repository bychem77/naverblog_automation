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
const apiKey = process.env.OPENAI_API_KEY?.trim();
const model = process.env.OPENAI_IMAGE_MODEL?.trim() || 'gpt-image-2';
const quality = process.env.OPENAI_IMAGE_QUALITY?.trim() || 'medium';
const size = process.env.OPENAI_IMAGE_SIZE?.trim() || '1024x1536';
const pexelsApiKey = process.env.PEXELS_API_KEY?.trim();
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

const usedPhotoIds = new Set();
const pexelsCredits = [];

// A query term can legitimately collide with an unrelated stock-photo category
// (e.g. "isopropyl alcohol" pulling in drinking-alcohol photos because of the
// word "alcohol"). The query itself is already stripped of that word unless
// the manuscript is genuinely about that category (see beverage_topic in
// md_to_cardnews.js), and this is a backup net: reject candidates whose own
// description still names that unrelated category, unless this manuscript
// actually is about it.
const offTopicAltKeywords = [
  'beer', 'ale', 'lager', 'brewery', 'brewing', 'pint', 'whisky', 'whiskey',
  'vodka', 'rum', 'gin ', 'tequila', 'wine', 'champagne', 'prosecco', 'sparkling wine',
  'cocktail', 'liquor', 'bartender', 'pub'
];
const allowOffTopicAlt = Boolean(data.metadata?.beverage_topic);

function isOffTopic(photo) {
  const alt = (photo.alt || '').toLowerCase();
  return offTopicAltKeywords.some((word) => alt.includes(word));
}

async function fetchPexelsPage(query, page) {
  const searchUrl = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=80&page=${page}&orientation=portrait`;
  const searchResponse = await fetch(searchUrl, {
    headers: { Authorization: pexelsApiKey },
    signal: AbortSignal.timeout(30_000)
  });
  if (!searchResponse.ok) throw new Error(`Pexels API returned HTTP ${searchResponse.status}`);
  const searchPayload = await searchResponse.json();
  return searchPayload.photos || [];
}

async function requestPexelsImage(query) {
  // A narrow query (e.g. a single chemical name repeated across several
  // slides) can exhaust its own on-topic, not-yet-used candidates within one
  // page of results. Keep paging in that case instead of falling back to a
  // photo already used elsewhere in this same card set.
  let candidates = [];
  let unused = [];
  for (let page = 1; page <= 3; page += 1) {
    const pagePhotos = await fetchPexelsPage(query, page);
    if (!pagePhotos.length) break;
    candidates = candidates.concat(pagePhotos);
    const onTopic = allowOffTopicAlt ? candidates : candidates.filter((p) => !isOffTopic(p));
    const pool = onTopic.length ? onTopic : candidates;
    unused = pool.filter((p) => !usedPhotoIds.has(`pexels:${p.id}`));
    if (unused.length) break;
  }
  if (!candidates.length) throw new Error(`No Pexels results for "${query}"`);
  if (!unused.length) throw new Error(`No unused Pexels photo left for "${query}" after checking ${candidates.length} results`);

  const photo = unused[Math.floor(Math.random() * unused.length)];
  usedPhotoIds.add(`pexels:${photo.id}`);

  const imageUrl = photo.src.large2x || photo.src.large || photo.src.original;
  const imageResponse = await fetch(imageUrl, { signal: AbortSignal.timeout(60_000) });
  if (!imageResponse.ok) throw new Error(`Failed to download Pexels photo (HTTP ${imageResponse.status})`);
  return {
    bytes: Buffer.from(await imageResponse.arrayBuffer()),
    credit: {
      photo_id: photo.id,
      photographer: photo.photographer,
      photographer_url: photo.photographer_url,
      photo_url: photo.url,
      alt: photo.alt,
      query
    }
  };
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
  const providers = [];
  if (pexelsApiKey) providers.push({ name: 'pexels', fetchBytes: () => requestPexelsImage(job.query) });
  if (apiKey) providers.push({ name: 'openai', fetchBytes: () => requestImage(`${sharedDirection} ${job.direction} ${job.prompt}`) });

  let lastError;
  for (const provider of providers) {
    try {
      const result = await provider.fetchBytes();
      const bytes = Buffer.isBuffer(result) ? result : result.bytes;
      fs.writeFileSync(job.apiFilePath, bytes, { mode: 0o600 });
      job.card.background = templateRelative(job.apiFilePath);
      if (provider.name === 'pexels' && result.credit) {
        pexelsCredits.push({ card: job.label, ...result.credit });
      }
      console.log(`Generated ${path.basename(job.apiFilePath)} via ${provider.name}`);
      return provider.name;
    } catch (error) {
      lastError = error;
      console.warn(`${provider.name} image fetch failed for ${job.label}: ${error.message}`);
    }
  }
  console.warn(`Image sourcing failed for ${job.label}; keeping its placeholder background.${lastError ? ` ${lastError.message}` : ''}`);
  return false;
}

async function main() {
  const jobs = [
    {
      label: 'cover',
      card: data.cover,
      prompt: data.cover.image_prompt,
      query: data.cover.image_query || 'industrial laboratory technology',
      direction: 'Use one strong topic-specific hero subject and a premium, clean composition.',
      apiFilePath: path.join(imageDir, 'cover.png')
    },
    ...data.slides.map((slide, index) => ({
      label: `content ${index + 1}`,
      card: slide,
      prompt: slide.image_prompt,
      query: slide.image_query || 'industrial laboratory technology',
      direction: variations[index % variations.length],
      apiFilePath: path.join(imageDir, `content_${String(index + 1).padStart(2, '0')}.png`)
    }))
  ];

  const apiResults = [];
  if (pexelsApiKey || apiKey) {
    fs.mkdirSync(imageDir, { recursive: true });
    for (const job of jobs) apiResults.push(await generate(job));
  } else {
    console.log('Neither PEXELS_API_KEY nor OPENAI_API_KEY is configured; all pages will use placeholder backgrounds.');
  }

  const pexelsCount = apiResults.filter((result) => result === 'pexels').length;
  const openaiCount = apiResults.filter((result) => result === 'openai').length;
  const placeholderCount = jobs.length - pexelsCount - openaiCount;

  data.outro.background = data.cover.background;
  data.outro.same_background_as = 'cover';
  if (pexelsCount && openaiCount) {
    data.outro.notice = '* 본 콘텐츠에는 Pexels 제공 사진과 내용의 이해를 돕기 위한 AI 생성 이미지가 사용되었습니다.';
  } else if (pexelsCount) {
    data.outro.notice = '* 본 콘텐츠에는 Pexels 제공 사진이 사용되었습니다.';
  } else if (openaiCount) {
    data.outro.notice = '* 본 콘텐츠에 사용된 이미지는 내용의 이해를 돕기 위해 AI로 생성되었습니다.';
  } else {
    data.outro.notice = '* 본 콘텐츠의 이미지는 내용의 이해를 돕기 위한 자료입니다.';
  }
  data.metadata = {
    ...data.metadata,
    image_sources: {
      pexels: pexelsCount,
      openai: openaiCount,
      placeholders: placeholderCount,
      total: jobs.length,
      model,
      size,
      quality
    },
    ...(pexelsCredits.length ? { pexels_credits: pexelsCredits } : {})
  };

  fs.writeFileSync(jsonPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  console.log(`Image preparation complete: ${pexelsCount} Pexels, ${openaiCount} OpenAI, ${placeholderCount} placeholder.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
