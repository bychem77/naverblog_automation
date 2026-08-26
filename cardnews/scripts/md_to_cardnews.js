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
  return /^(A\.|B\.|C\.|D\.|E\.)?\s*(승인용 요약|네이버 블로그 본문|발행 설정|본문|태그|이미지|사실|참고|출처)/i.test(title);
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

function shorten(text, max = 94) {
  const value = cleanInline(text);
  if (value.length <= max) return value;
  const cut = value.slice(0, max - 1);
  const boundary = Math.max(cut.lastIndexOf(' '), cut.lastIndexOf(','));
  return `${cut.slice(0, boundary > max * 0.55 ? boundary : max - 1).trim()}…`;
}

function parseTags(source) {
  const tagSection = source.match(/(?:태그 입력란|네이버 태그 편집란 입력)[\s\S]*?(?=\n##\s|$)/i)?.[0] || '';
  return [...new Set((tagSection.match(/#[\p{L}\p{N}_-]+/gu) || []))].slice(0, 12);
}

function parseMetadata(source) {
  const category = source.match(/(?:카테고리|콘텐츠 유형)\s*:\s*`?([^\n`]+)/i)?.[1]?.trim();
  return { category: category || 'BYCHEM SOLUTION', tags: parseTags(source) };
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

let contentSections = headings.filter((section) => {
  if (section.level < 2 || section.level > 3 || isMetaHeading(section.title)) return false;
  const body = sentencesFrom(section.lines);
  return body.length > 0;
});

// Keep the prototype's four-part story: definition, role, selection/technology, safety/summary.
if (contentSections.length > 4) {
  const selected = [];
  const take = (pattern) => {
    const match = contentSections.find((section) => !selected.includes(section) && pattern.test(section.title));
    if (match) selected.push(match);
  };
  selected.push(contentSections[0]);
  take(/왜|역할|어떤 산업|활용|중요/);
  take(/선택 기준|선택해야|어떻게 선택|다른|다를|차이|만드는 데|필요한 기술|품질/);
  take(/안전|열관리|확인해야|체크|한 문장|정리|마무리|결론/);
  for (const section of contentSections) {
    if (selected.length === 4) break;
    if (!selected.includes(section)) selected.push(section);
  }
  contentSections = selected;
}

while (contentSections.length < 4) {
  contentSections.push({
    title: ['핵심 원리', '활용 포인트', '선택 기준', '안전 체크'][contentSections.length],
    lines: ['원고의 관련 내용을 확인해 카드 문구를 보완해 주세요.']
  });
}

const defaultTags = metadata.tags.length ? metadata.tags : ['#바이켐', '#산업인사이트', '#카드뉴스'];
const commonTags = new Set(['#바이켐', '#페인트시너', '#산업용세정제', '#산업용용제', '#유기용제']);
const topicTags = defaultTags.filter((tag) => !commonTags.has(tag));
const coverTags = (topicTags.length >= 3 ? topicTags : defaultTags).slice(0, 3);

const slides = contentSections.slice(0, 4).map((section, index) => {
  const cleanTitle = stripEmoji(section.title);
  const sentences = sentencesFrom(section.lines);
  const body = shorten(sentences.join(' '), 80) || '원고의 관련 내용을 확인해 카드 문구를 보완해 주세요.';
  return {
    title: shorten(cleanTitle, 28),
    body,
    background: `../assets/backgrounds/bg_0${index + 2}.jpg`,
    image_prompt: `BYCHEM industrial editorial image about "${cleanTitle}". Show ${sentences.slice(0, 2).join(' ')}. Realistic B2B industrial photography, clean professional mood, 4:5 portrait composition, leave the lower 40 percent as calm negative space for Korean text, balanced accent colors, no text, no logo, no watermark, no dark sci-fi, no hazardous scene, no identifiable company or product.`
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
    title: shorten(title.replace(/\s*쉽게 알아보기\s*$/u, ''), 28),
    hashtags: coverTags,
    background: '../assets/backgrounds/bg_01.jpg',
    image_prompt: `Create a premium hero image for a Korean BYCHEM B2B card-news cover about "${title}". Visually express the specific subject using realistic industrial, laboratory, material, or technology photography. Clean professional mood, strong single focal point, 4:5 portrait composition, leave the lower 40 percent calm enough for a large Korean title, no text, no logo, no watermark, no identifiable company or product, no hazardous or sensational scene.`
  },
  slides,
  outro: {
    notice: '* 본 콘텐츠에 사용된 이미지는 내용의 이해를 돕기 위해 AI로 생성되었습니다.',
    background: '../assets/backgrounds/bg_01.jpg',
    same_background_as: 'cover',
    image_prompt: 'Reuse the exact same generated image file as cover.background. Do not generate a variation.'
  },
  metadata: {
    derived_from: title,
    category: metadata.category,
    sections_detected: headings.filter((section) => section.level >= 2 && !isMetaHeading(section.title)).map((section) => section.title),
    official_basis_present: /공식 근거|사실·안전 근거|참고자료/i.test(markdown)
  }
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
console.log(`Created ${outputPath} (6 cards)`);
