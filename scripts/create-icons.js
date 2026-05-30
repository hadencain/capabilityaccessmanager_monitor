const { PNG } = require('pngjs');
const fs = require('fs');
const path = require('path');

function writeSolidPNG(r, g, b, size, outPath) {
  const png = new PNG({ width: size, height: size, filterType: -1 });
  for (let i = 0; i < png.data.length; i += 4) {
    png.data[i] = r;
    png.data[i + 1] = g;
    png.data[i + 2] = b;
    png.data[i + 3] = 255;
  }
  fs.writeFileSync(outPath, PNG.sync.write(png));
  console.log('wrote', outPath);
}

const assetsDir = path.join(__dirname, '..', 'assets');
fs.mkdirSync(assetsDir, { recursive: true });

// 16x16 tray icons
writeSolidPNG(34, 197, 94,  16, path.join(assetsDir, 'icon-green.png'));
writeSolidPNG(234, 179, 8,  16, path.join(assetsDir, 'icon-yellow.png'));
writeSolidPNG(239, 68, 68,  16, path.join(assetsDir, 'icon-red.png'));

// 256x256 installer icon
writeSolidPNG(34, 197, 94, 256, path.join(assetsDir, 'icon-app.png'));

console.log('Done. Replace placeholder icons in assets/ before distributing.');
