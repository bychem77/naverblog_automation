const fs = require("fs");
const path = require("path");

const [, , inputPath, outputPath] = process.argv;

if (!inputPath || !outputPath) {
  console.error("Usage: node export_news_caption.js <input.json> <output.txt>");
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(inputPath, "utf8"));

if (data.category !== "BYCHEM 뉴스") {
  throw new Error('category must be exactly "BYCHEM 뉴스".');
}

if (typeof data.caption !== "string" || !data.caption.trim()) {
  throw new Error("caption is required and must be a non-empty string.");
}

if (typeof data.caption_en !== "string" || !data.caption_en.trim()) {
  throw new Error("caption_en is required and must be a non-empty string.");
}

if (!Array.isArray(data.hashtags) || data.hashtags.length === 0) {
  throw new Error("hashtags is required and must be a non-empty array.");
}

const hashtags = data.hashtags.map((tag) => {
  if (typeof tag !== "string" || !tag.trim()) {
    throw new Error("Every hashtag must be a non-empty string.");
  }
  const clean = tag.trim();
  return clean.startsWith("#") ? clean : `#${clean}`;
});

const content = `${data.caption.trim()}\n\n${data.caption_en.trim()}\n\n${hashtags.join(" ")}\n`;

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, content, "utf8");
console.log(`Wrote Instagram caption: ${outputPath}`);
