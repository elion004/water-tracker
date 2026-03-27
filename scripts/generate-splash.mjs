import sharp from 'sharp';

const size = 400;

const dropPath = `
  M200 48
  C200 48 104 160 104 228
  C104 281.0 146.9 324 200 324
  C253.1 324 296 281.0 296 228
  C296 160 200 48 200 48Z
`;

const shinePath = `
  M158 192
  C158 172 172 152 184 140
`;

// Light mode: green drop on transparent (white) background
const svgLight = `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <path d="${dropPath}" fill="#1D9E75"/>
  <path d="${shinePath}" stroke="rgba(255,255,255,0.5)" stroke-width="12" stroke-linecap="round" fill="none"/>
</svg>`;

// Dark mode: white drop on transparent (dark green) background
const svgDark = `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <path d="${dropPath}" fill="white"/>
  <path d="${shinePath}" stroke="rgba(255,255,255,0.4)" stroke-width="12" stroke-linecap="round" fill="none"/>
</svg>`;

await sharp(Buffer.from(svgLight)).png().toFile('assets/images/splash-icon.png');
console.log('splash-icon.png (light) generated');

await sharp(Buffer.from(svgDark)).png().toFile('assets/images/splash-icon-dark.png');
console.log('splash-icon-dark.png (dark) generated');
