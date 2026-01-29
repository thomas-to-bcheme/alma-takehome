#!/usr/bin/env node

/**
 * Generate PNG icons for the Alma Form Filler Chrome extension.
 * Run with: node generate-icons.js
 *
 * Requires canvas package: npm install canvas
 * Or just open generate-icons.html in a browser and download the icons.
 */

const fs = require('fs');
const path = require('path');

// Check if canvas is available
let createCanvas;
try {
  createCanvas = require('canvas').createCanvas;
} catch (e) {
  console.log('Canvas package not available.');
  console.log('');
  console.log('Option 1: Install canvas package');
  console.log('  npm install canvas');
  console.log('  node generate-icons.js');
  console.log('');
  console.log('Option 2: Use browser');
  console.log('  Open generate-icons.html in a browser');
  console.log('  Download the PNG icons from there');
  console.log('');
  process.exit(0);
}

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Blue background with rounded corners
  const radius = size * 0.125;
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(size - radius, 0);
  ctx.quadraticCurveTo(size, 0, size, radius);
  ctx.lineTo(size, size - radius);
  ctx.quadraticCurveTo(size, size, size - radius, size);
  ctx.lineTo(radius, size);
  ctx.quadraticCurveTo(0, size, 0, size - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.fillStyle = '#3B82F6';
  ctx.fill();

  // Letter "A"
  ctx.fillStyle = 'white';
  ctx.font = `bold ${size * 0.625}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('A', size / 2, size / 2 + size * 0.05);

  return canvas.toBuffer('image/png');
}

const iconsDir = path.join(__dirname, 'icons');

[16, 48, 128].forEach(size => {
  const buffer = generateIcon(size);
  const filePath = path.join(iconsDir, `icon${size}.png`);
  fs.writeFileSync(filePath, buffer);
  console.log(`Generated ${filePath}`);
});

console.log('');
console.log('Icons generated successfully!');
