// Generates a small tileable grayscale noise PNG used as a subtle "paper grain"
// overlay on stamps. High-frequency random speckle tiles seamlessly, giving a
// matte, fibrous tooth when overlaid at low opacity. Run: node scripts/gen-paper-grain.js
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

const SIZE = 128;

// CRC32 (PNG chunk checksum).
const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
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

// Raw RGBA scanlines (filter byte 0 per row). Speckle = black/white specks with
// low, slightly-varied alpha so the grain reads as soft paper tooth, not noise.
const raw = Buffer.alloc(SIZE * (1 + SIZE * 4));
let p = 0;
for (let y = 0; y < SIZE; y++) {
  raw[p++] = 0; // filter: none
  for (let x = 0; x < SIZE; x++) {
    const r = Math.random();
    const light = r > 0.5;
    const v = light ? 255 : 0;
    // Light specks fainter than dark so the net effect is matte, not sparkly.
    const alpha = Math.floor(Math.random() * (light ? 9 : 14));
    raw[p++] = v;
    raw[p++] = v;
    raw[p++] = v;
    raw[p++] = alpha;
  }
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 6; // color type: RGBA
// compression/filter/interlace = 0

const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk('IHDR', ihdr),
  chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]);

const out = path.join(__dirname, '..', 'assets', 'images', 'paper-grain.png');
fs.writeFileSync(out, png);
console.log(`Wrote ${out} (${png.length} bytes, ${SIZE}x${SIZE})`);
