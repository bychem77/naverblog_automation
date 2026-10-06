#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const [, , inputPath, outputPath] = process.argv;
if (!inputPath || !outputPath) {
  console.error('Usage: node export_cardnews_caption.js <input.md> <output.txt>');
  process.exit(1);
}
if (!/\.md$/i.test(inputPath)) throw new Error('Input must be a Markdown manuscript.');
const markdown = fs.readFileSync(inputPath, 'utf8');
if (!/^[ \t]*(?:-[ \t]*)?카테고리:[ \t]*`?BYCHEM 인사이트`?[ \t]*$/m.test(markdown)) {
  throw new Error('Only BYCHEM 인사이트 manuscripts can export card-news captions.');
}
const captionPath = inputPath.replace(/\.md$/i, '.caption.json');
if (!fs.existsSync(captionPath)) {
  throw new Error('Missing caption file: ' + captionPath + '. Prepare Korean and English captions from the manuscript before building.');
}
const data = JSON.parse(fs.readFileSync(captionPath, 'utf8'));
if (data.category !== 'BYCHEM 인사이트') throw new Error('Caption category must be BYCHEM 인사이트.');
for (const field of ['caption', 'caption_en']) {
  if (typeof data[field] !== 'string' || !data[field].trim()) throw new Error(field + ' is required.');
}
if (!Array.isArray(data.hashtags) || !data.hashtags.length) throw new Error('hashtags is required.');
const hashtags = [...new Set(data.hashtags.map(tag => {
  if (typeof tag !== 'string' || !tag.trim()) throw new Error('Every hashtag must be a non-empty string.');
  const clean = tag.trim();
  if (/\s/.test(clean)) throw new Error('Hashtags cannot contain whitespace.');
  return clean.startsWith('#') ? clean : '#' + clean;
}))];
if (!hashtags.includes('#바이켐') || !hashtags.includes('#BYCHEM')) {
  throw new Error('Hashtags must include #바이켐 and #BYCHEM.');
}
if (hashtags.length > 5) {
  throw new Error('Instagram captions can include at most 5 hashtags.');
}
const contentBody = data.caption.trim() + '\n\n' + data.caption_en.trim() + '\n\n' + hashtags.join(' ');
const characterCount = Array.from(contentBody).length;
if (characterCount > 500) {
  throw new Error('Instagram/Threads caption must be 500 characters or fewer; received ' + characterCount + '.');
}
const content = contentBody + '\n';
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, content, 'utf8');
console.log('Wrote Instagram caption: ' + outputPath);

