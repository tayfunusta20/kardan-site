// PNG (2880px) -> WebP 1920px for the website.
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const DIR = '/Users/tayfunusta/Documents/Projects/kardan-site/screenshots';
(async () => {
  for (const f of fs.readdirSync(DIR).filter(f => f.endsWith('.png'))) {
    const out = path.join(DIR, f.replace(/\.png$/, '.webp'));
    await sharp(path.join(DIR, f)).resize({ width: 1920 }).webp({ quality: 84 }).toFile(out);
    console.log(f, '->', path.basename(out), Math.round(fs.statSync(out).size / 1024) + 'KB');
  }
})();
