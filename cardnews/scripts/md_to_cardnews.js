#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const [, , inputArg, outputArg] = process.argv;

if (!inputArg) {
  console.error('Usage: node scripts/md_to_cardnews.js <input.md> [output.json]');
  process.exit(1);
}

const inputPath = path.resolve(inputArg);
const outputPath = path.resolve(outputArg || inputPath.replace(/\.md$/i, '.json'));
const markdown = fs.readFileSync(inputPath, 'utf8').replace(/\r\n?/g, '\n');

function cleanInline(value = '') {
  return value
    .replace(/!\[[^\]]*]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)]\([^)]*\)/g, '$1')
    .replace(/[`*_~]/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripEmoji(value = '') {
  return value.replace(/^[\p{Extended_Pictographic}\uFE0F\s]+/u, '').trim();
}

function isMetaHeading(title) {
  return /^(A\.|B\.|C\.|D\.|E\.)?\s*(승인용 요약|네이버 블로그 본문|발행 설정|본문|네이버\s*태그|태그|이미지|사실|참고|출처)/i.test(title);
}

function isNoise(line) {
  return !line
    || /^---+$/.test(line)
    || /^>/.test(line)
    || /^\[?(대표사진|본문 이미지|네이버 스티커|캡션|이미지 설명)/.test(line)
    || /^본 콘텐츠에 사용된 이미지는/.test(line)
    || /^참고자료\s*:/.test(line)
    || /^※/.test(line)
    || /^\|/.test(line);
}

function sentencesFrom(lines) {
  const items = [];
  let paragraph = '';

  for (const rawLine of lines) {
    const line = cleanInline(rawLine.trim());
    if (isNoise(line)) continue;
    if (/^[-*+]\s+/.test(rawLine.trim()) || /^(✅|✔|①|②|③|④|⑤)/.test(line)) {
      items.push(cleanInline(line.replace(/^[-*+]\s+/, '').replace(/^(✅|✔|①|②|③|④|⑤)\s*/, '')));
      continue;
    }
    paragraph += `${paragraph ? ' ' : ''}${line}`;
  }

  if (paragraph) {
    items.unshift(...paragraph.split(/(?<=[.!?。]|(?:요|다|죠|니다)\.)\s+/).filter(Boolean));
  }
  return items.filter(Boolean);
}

function summarize(sentences) {
  const candidates = sentences.map(cleanInline).filter(Boolean);
  const complete = candidates.filter((sentence) => /[.!?。]$/.test(sentence));
  return (complete.length ? complete : candidates).slice(0, 2).join(' ');
}

function parseTags(source) {
  const tagSection = source.match(/(?:태그 입력란|네이버 태그 편집란 입력)[\s\S]*?(?=\n##\s|$)/i)?.[0] || '';
  return [...new Set((tagSection.match(/#[\p{L}\p{N}_-]+/gu) || []))].slice(0, 12);
}

function parseMetadata(source) {
  const category = source.match(/(?:카테고리|콘텐츠 유형)\s*:\s*`?([^\n`]+)/i)?.[1]?.trim();
  return { category: category || 'BYCHEM SOLUTION', tags: parseTags(source) };
}

// Manuscripts often spell out an acronym once, e.g. "IPA(Isopropyl Alcohol)".
// Capture that so stock photo search uses the full term instead of an ambiguous acronym.
function findAcronymExpansions(source) {
  const map = new Map();
  const pattern = /\*{0,2}\b([A-Z]{2,8})\*{0,2}\(([A-Za-z][A-Za-z .-]{2,50})\)/g;
  let match;
  while ((match = pattern.exec(source))) {
    if (!map.has(match[1])) map.set(match[1], match[2].trim());
  }
  return map;
}

const genericStockQueries = [
  'industrial laboratory equipment',
  'semiconductor manufacturing facility',
  'chemical process technology',
  'precision engineering workshop',
  'scientific research laboratory',
  'industrial factory technology',
  'clean room manufacturing',
  'quality control testing lab',
  'raw material sample analysis',
  'industrial supply chain logistics'
];

// A handful of English chemistry words double as an unrelated consumer
// category on stock-photo sites — "alcohol" pulls in beer/wine/champagne
// photos regardless of "isopropyl" sitting right next to it. Strip those
// words from the search query unless the manuscript is actually about that
// category (see isBeverageTopic below), so an off-topic result never comes
// from the query itself.
const ambiguousQueryWords = ['alcohol'];

function stripAmbiguousWords(term) {
  return ambiguousQueryWords
    .reduce((acc, word) => acc.replace(new RegExp(`\\b${word}\\b`, 'gi'), ''), term)
    .replace(/\s+/g, ' ')
    .trim();
}

const beverageTopicKeywords = [
  '맥주', '양조', '브루어리', '와인', '샴페인', '칵테일', '소주', '위스키', '보드카', '증류주', '음주',
  'beer', 'brewery', 'brewing', 'whisky', 'whiskey', 'vodka', 'wine', 'champagne', 'cocktail', 'liquor', 'rum', 'tequila'
];
const isBeverageTopic = beverageTopicKeywords.some((word) => markdown.toLowerCase().includes(word));

// Only fall back to a generic descriptor when the manuscript itself gives us
// nothing to search on. When it does, the query should be the manuscript's own
// terms alone — appending a generic word like "industrial" lets that common
// word dominate stock-photo relevance ranking and drowns out the real topic.
function stockQueryFrom(text, expansions, index) {
  // Strip parenthetical asides first so an acronym's own spelled-out form
  // (already captured via `expansions`) isn't tokenized a second time.
  const latinTerms = text.replace(/\([^)]*\)/g, ' ').match(/[A-Za-z][A-Za-z0-9+-]{1,}/g) || [];
  if (!latinTerms.length) return genericStockQueries[index % genericStockQueries.length];
  let expanded = [...new Set(latinTerms.map((term) => expansions.get(term.toUpperCase()) || term))];
  if (!isBeverageTopic) {
    expanded = expanded.map(stripAmbiguousWords).filter(Boolean);
    if (!expanded.length) return genericStockQueries[index % genericStockQueries.length];
  }
  return expanded.slice(0, 6).join(' ');
}

function parseSections(source) {
  const lines = source.split('\n');
  const headings = [];
  let current = null;

  for (const line of lines) {
    const match = line.match(/^(#{1,4})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const title = cleanInline(match[2]);
      if (level === 1 && !headings.length) {
        headings.push({ level, title, lines: [], rootTitle: true });
        current = headings.at(-1);
      } else {
        headings.push({ level, title, lines: [], rootTitle: false });
        current = headings.at(-1);
      }
    } else if (current) {
      current.lines.push(line);
    }
  }
  return headings;
}

const metadata = parseMetadata(markdown);
const headings = parseSections(markdown);
const explicitTitle = markdown.match(/^-\s*제목\s*:\s*`?([^\n`]+)/m)?.[1]?.trim();
const rootCandidates = headings.filter((h) => h.level === 1 && !isMetaHeading(h.title));
const title = cleanInline(explicitTitle || rootCandidates.at(-1)?.title || path.basename(inputPath, path.extname(inputPath)));
const introText = sentencesFrom(rootCandidates.at(-1)?.lines || []).join(' ');

let contentSections = headings.filter((section) => {
  if (section.level < 2 || section.level > 3 || isMetaHeading(section.title)) return false;
  const body = sentencesFrom(section.lines);
  return body.length > 0;
});

// Use the manuscript's own story without padding. If it is unusually long,
// retain the first five sections and its final takeaway.
if (contentSections.length > 6) {
  contentSections = [...contentSections.slice(0, 5), contentSections.at(-1)];
}

if (contentSections.length < 3) {
  throw new Error(`At least 3 content sections are required; found ${contentSections.length} in ${inputPath}`);
}

const defaultTags = metadata.tags.length ? metadata.tags : ['#바이켐', '#산업인사이트', '#카드뉴스'];
const commonTags = new Set(['#바이켐', '#페인트시너', '#산업용세정제', '#산업용용제', '#유기용제']);
const topicTags = defaultTags.filter((tag) => !commonTags.has(tag));
const coverTags = (topicTags.length >= 3 ? topicTags : defaultTags).slice(0, 3);

const acronymExpansions = findAcronymExpansions(markdown);

const slides = contentSections.map((section, index) => {
  const cleanTitle = stripEmoji(section.title);
  const sentences = sentencesFrom(section.lines);
  const body = summarize(sentences);
  return {
    title: cleanTitle,
    body,
    background: `../assets/backgrounds/bg_0${(index % 4) + 2}.jpg`,
    image_prompt: `BYCHEM industrial editorial image about "${cleanTitle}". Show ${sentences.slice(0, 2).join(' ')}. Realistic B2B industrial photography, clean professional mood, 4:5 portrait composition, leave the lower 40 percent as calm negative space for Korean text, balanced accent colors, no text, no logo, no watermark, no dark sci-fi, no hazardous scene, no identifiable company or product.`,
    image_query: stockQueryFrom(`${cleanTitle} ${sentences.join(' ')}`, acronymExpansions, index + 1)
  };
});

const result = {
  schemaVersion: 1,
  brand_line: 'BYCHEM   |   SOLUTION',
  brand: {
    blue: '#0072CE',
    green: '#009140',
    font: 'Pretendard'
  },
  source_md: path.basename(inputPath),
  cover: {
    title: title.replace(/\s*쉽게 알아보기\s*$/u, ''),
    hashtags: coverTags,
    background: '../assets/backgrounds/bg_01.jpg',
    image_prompt: `Create a premium hero image for a Korean BYCHEM B2B card-news cover about "${title}". Visually express the specific subject using realistic industrial, laboratory, material, or technology photography. Clean professional mood, strong single focal point, 4:5 portrait composition, leave the lower 40 percent calm enough for a large Korean title, no text, no logo, no watermark, no identifiable company or product, no hazardous or sensational scene.`,
    image_query: stockQueryFrom(`${title} ${introText}`, acronymExpansions, 0)
  },
  slides,
  outro: {
    notice: '* 본 콘텐츠의 이미지는 내용의 이해를 돕기 위한 자료입니다.',
    background: '../assets/backgrounds/bg_01.jpg',
    same_background_as: 'cover',
    image_prompt: 'Reuse the exact same generated image file as cover.background. Do not generate a variation.'
  },
  metadata: {
    derived_from: title,
    category: metadata.category,
    sections_detected: headings.filter((section) => section.level >= 2 && !isMetaHeading(section.title)).map((section) => section.title),
    official_basis_present: /공식 근거|사실·안전 근거|참고자료/i.test(markdown),
    beverage_topic: isBeverageTopic
  }
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
console.log(`Created ${outputPath} (${slides.length + 2} cards)`);
