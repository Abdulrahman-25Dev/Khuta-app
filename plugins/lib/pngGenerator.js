'use strict';
// مولّد صور PNG بسيط (بدون اعتماديات) يُستخدم كأيقونات احتياطية ملونة
// عند غياب ملفات الأيقونات الحقيقية أثناء البناء.
const zlib = require('zlib');

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function hexToRgb(hex) {
  const clean = String(hex || '#000000').replace('#', '');
  const value = parseInt(clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean, 16);
  return [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff];
}

// يرسم خلفية ملونة مع دائرة داكنة/فاتحة في المنتصف (شعار نائب "مسار/خطوة")
function createPlaceholderIconPng(size, backgroundHex, foregroundHex) {
  const bg = hexToRgb(backgroundHex);
  const fg = hexToRgb(foregroundHex || backgroundHex);
  const data = Buffer.alloc(size * size * 4);
  const center = size / 2;
  const circleR = size * 0.3;
  const ringR = size * 0.42;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x + 0.5 - center;
      const dy = y + 0.5 - center;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const idx = (y * size + x) * 4;
      let color = bg;
      if (dist <= circleR) color = fg;
      else if (dist <= ringR) {
        // حلقة باهتة حول الرمز لإضافة تمييز بصري بسيط
        const t = (dist - circleR) / (ringR - circleR);
        color = [
          Math.round(bg[0] + (fg[0] - bg[0]) * (0.15 + 0.85 * t)),
          Math.round(bg[1] + (fg[1] - bg[1]) * (0.15 + 0.85 * t)),
          Math.round(bg[2] + (fg[2] - bg[2]) * (0.15 + 0.85 * t)),
        ];
      }
      data[idx] = color[0];
      data[idx + 1] = color[1];
      data[idx + 2] = color[2];
      data[idx + 3] = 0xff;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const scanlines = Buffer.alloc(size * (1 + size * 4));
  for (let y = 0; y < size; y++) {
    scanlines[y * (1 + size * 4)] = 0;
    data.copy(scanlines, y * (1 + size * 4) + 1, y * size * 4, (y + 1) * size * 4);
  }

  return Buffer.concat([
    PNG_SIGNATURE,
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(scanlines)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

module.exports = { createPlaceholderIconPng };