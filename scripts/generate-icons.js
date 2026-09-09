const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const outDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

function createIconSvg(size, isMaskable = false) {
  const padding = isMaskable ? size * 0.22 : size * 0.15;
  const contentSize = size - padding * 2;
  const strokeWidth = Math.max(2, Math.round(size * 0.015));

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0F121C" />
        <stop offset="100%" stop-color="#08090C" />
      </linearGradient>
      <linearGradient id="cloud-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#10B981" />
        <stop offset="100%" stop-color="#38BDF8" />
      </linearGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="${size * 0.03}" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    
    <!-- Background -->
    <rect width="${size}" height="${size}" rx="${isMaskable ? 0 : size * 0.22}" fill="url(#bg-grad)" />
    
    ${!isMaskable ? `
    <!-- Neon border -->
    <rect x="${strokeWidth / 2}" y="${strokeWidth / 2}" width="${size - strokeWidth}" height="${size - strokeWidth}" rx="${size * 0.22}" fill="none" stroke="#10B981" stroke-opacity="0.3" stroke-width="${strokeWidth}" />
    ` : ''}

    <!-- Cloud Icon in center -->
    <g transform="translate(${padding}, ${padding}) scale(${contentSize / 24})" filter="url(#glow)">
      <path
        d="M6.5 19C4 19 2 17 2 14.5C2 12.3 3.6 10.5 5.7 10.1C5.3 9.4 5 8.5 5 7.5C5 4.5 7.5 2 10.5 2C13 2 15.1 3.6 15.8 5.9C16.2 5.6 16.8 5.5 17.5 5.5C19.4 5.5 21 7.1 21 9C21 9.3 20.9 9.6 20.8 9.9C22.1 10.5 23 11.8 23 13.5C23 15.9 21 18 18.5 18L6.5 19Z"
        fill="url(#cloud-grad)"
      />
    </g>
  </svg>`;
}

async function run() {
  const configs = [
    { name: 'icon-192.png', size: 192, maskable: false },
    { name: 'icon-512.png', size: 512, maskable: false },
    { name: 'icon-maskable-192.png', size: 192, maskable: true },
    { name: 'icon-maskable-512.png', size: 512, maskable: true },
    { name: 'apple-touch-icon.png', size: 180, maskable: false },
  ];

  for (const cfg of configs) {
    const svg = createIconSvg(cfg.size, cfg.maskable);
    const dest = path.join(outDir, cfg.name);
    await sharp(Buffer.from(svg)).png().toFile(dest);
    console.log(`Generated ${cfg.name} (${cfg.size}x${cfg.size})`);
  }

  // Also save master SVG
  const masterSvg = createIconSvg(512, false);
  fs.writeFileSync(path.join(outDir, 'icon.svg'), masterSvg, 'utf8');
  console.log('Generated master icon.svg');
}

run().catch(console.error);
