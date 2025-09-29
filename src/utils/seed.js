// utils/seed.js

export const PASTEL_PALETTE = [
  // soft but lively; tested on dark UI
  "#FFE3A3", // honey
  "#FFD6E7", // blush pink
  "#E7D6FF", // lilac
  "#D6E7FF", // baby blue
  "#CFF5FF", // ice
  "#CFFFE1", // mint
  "#D8FFC9", // spring green
  "#FFF6C7", // lemonade
  "#FFE8C6", // peach
  "#FCD5CE", // coral milk
  "#E4F1D5", // pistachio
  "#E3F2FD", // powder blue
  "#E0E7FF", // periwinkle
  "#F1E8FF", // orchid
  "#FFE4F2", // cotton candy
  "#E8F7F2", // sea foam
  "#FFF0D6", // apricot
  "#FDE2FF", // mauve pink
  "#E6F7D6", // light lime
  "#F8E1E1", // rose water
];

export function hashString(str = "") {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickFromPaletteDeterministic(
  seedStr,
  palette = PASTEL_PALETTE
) {
  const rnd = mulberry32(hashString(seedStr));
  // primary index
  let idx = Math.floor(rnd() * palette.length);
  // add a small jump based on another pull (0,1,2)
  idx = (idx + Math.floor(rnd() * 3)) % palette.length;
  return palette[idx];
}
