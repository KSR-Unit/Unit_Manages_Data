const fs = require('fs');
const path = require('path');

const srcPath = '/Users/pjmjk/.gemini/antigravity/brain/f0588604-83c3-4aca-8e1d-fb0fb65569a1/.system_generated/steps/256/content.md';
const destDir = path.join(__dirname);
const destPath = path.join(destDir, 'users.csv');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const lines = fs.readFileSync(srcPath, 'utf8').split('\n');

// Find where CSV starts (headers start with UserID,Email,...)
let startIdx = 0;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim().startsWith('UserID,Email,Pass,Status,UnitCode,Province,District,Subdistrict')) {
    startIdx = i;
    break;
  }
}

const csvLines = lines.slice(startIdx);
fs.writeFileSync(destPath, csvLines.join('\n'), 'utf8');
console.log(`Extracted CSV successfully to ${destPath}. Total lines: ${csvLines.length}`);
