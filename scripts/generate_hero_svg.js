import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
    width: 1200,
    height: 400,
    numCols: 40,
    maxBlocks: 28,
    gap: 2,
    heightRatio: 0.33,
    headroomRatio: 0.10
};

function getInterpolatedColor(t) {
    let r, g, b;
    t = Math.max(0, Math.min(1, t));

    if (t < 0.5) {
        // Green -> Yellow
        let localT = t * 2;
        r = Math.floor(255 * localT);
        g = 255;
        b = 0;
    } else {
        // Yellow -> Red
        let localT = (t - 0.5) * 2;
        r = 255;
        g = Math.floor(255 * (1 - localT));
        b = 0;
    }
    return `rgb(${r},${g},${b})`;
}

function generateSVG() {
    const { width, height, numCols, maxBlocks, gap, heightRatio, headroomRatio } = CONFIG;

    // Calculate Dimensions
    const availableWidth = width - (gap * (numCols + 1));
    const blockW = availableWidth / numCols;

    const effectiveAreaHeight = height * heightRatio;
    const availableHeightForBlocks = effectiveAreaHeight - (gap * (maxBlocks + 1));
    const blockH = availableHeightForBlocks > 0 ? availableHeightForBlocks / maxBlocks : 1;

    // Generate Data
    let rects = '';
    for (let i = 0; i < numCols; i++) {
        let t = i / (numCols - 1);

        // Gaussian Peaks logic matching SvgGenerator.js
        let bassPeak = 1.0 * Math.exp(-Math.pow(t - 0.0, 2) / 0.04);
        let midHighPeak = 0.75 * Math.exp(-Math.pow(t - 0.65, 2) / 0.12);

        let shape = bassPeak + midHighPeak;
        let noise = Math.random() * 0.15;

        // Apply Headroom
        let rawValue = Math.max(0, shape + noise);
        let normalizedHeight = Math.min(1.0, rawValue);
        let finalHeightFactor = normalizedHeight * (1 - headroomRatio);

        let colHeightInBlocks = Math.floor(finalHeightFactor * maxBlocks);

        const posX = gap + i * (blockW + gap);

        for (let j = 0; j < colHeightInBlocks; j++) {
            // Y Position (Bottom aligned)
            const posY = height - gap - blockH - (j * (blockH + gap));

            const t = j / (maxBlocks - 1);
            const color = getInterpolatedColor(t);

            rects += `<rect x="${posX.toFixed(2)}" y="${posY.toFixed(2)}" width="${blockW.toFixed(2)}" height="${blockH.toFixed(2)}" fill="${color}" />\n`;
        }
    }

    // Construct Full SVG
    const svgContent = `<svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#050505"/>
      <stop offset="50%" stop-color="#1a0b05"/>
      <stop offset="100%" stop-color="#050505"/>
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="100%" height="100%" fill="url(#bgGrad)"/>
  
  <!-- Equalizer Bars -->
  ${rects}
  
  <!-- Subtle Overlay/Glow -->
  <rect width="100%" height="100%" fill="url(#bgGrad)" opacity="0.1" style="mix-blend-mode: overlay"/>
</svg>`;

    return svgContent;
}

// Execute
const svgOutput = generateSVG();
const outputPath = path.join(__dirname, '../public/assets/images/hero_bg.svg');

fs.writeFileSync(outputPath, svgOutput);
console.log(`Generated SVG to ${outputPath}`);
