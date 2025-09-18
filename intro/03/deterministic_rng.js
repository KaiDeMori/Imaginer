"use strict";
/*
Deterministic RNG (sfc32) module – Early Universe Formation V2
-------------------------------------------------------------
Provides a reproducible random number generator that derives its seed from
`localStorage.getItem("eu_seed")` or falls back to `Date.now()` if none is
stored yet. The seed is then stored back into `localStorage` so that page
reloads remain deterministic until the user explicitly regenerates a new seed
(via the future Seed UI panel).

Public surface (attached to `window` and as ES module exports):
  • rand()          → float in the range [0, 1)
  • eu_seed         → the current seed string (for display purposes)

Usage example:
  import { rand } from "./deterministic_rng.js";
  const angle = rand() * Math.PI * 2;
*/

// ---------------------------------------------------------------------------
// 1 · Helper – cyrb128 hash ---------------------------------------------------
// ---------------------------------------------------------------------------
// Small string hash → four 32-bit unsigned ints. Perfectly adequate for our
// seeding purposes (we do not require crypto-grade randomness).
// Source: https://stackoverflow.com/a/52171480/1213519 (public domain)
function cyrb128(str) {
  let h1 = 1779033703, h2 = 3144134277,
      h3 = 1013904242, h4 = 2773480762;
  for (let i = 0, k; i < str.length; i++) {
    k = str.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  return [(h1 ^ h2 ^ h3 ^ h4) >>> 0, (h2 ^ h1) >>> 0,
          (h3 ^ h1) >>> 0, (h4 ^ h1) >>> 0];
}

// ---------------------------------------------------------------------------
// 2 · Helper – sfc32 PRNG -----------------------------------------------------
// ---------------------------------------------------------------------------
// A fast, simple, statistically solid PRNG perfect for non-crypto use-cases.
// Original author: Chris Doty-Humphrey – released to public domain.
function sfc32(a, b, c, d) {
  return function() {
    a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
    let t = (a + b) | 0;
    t = (t + d) | 0;
    d = (d + 1) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296; // 2^32
  };
}

// ---------------------------------------------------------------------------
// 3 · Resolve / persist seed --------------------------------------------------
// ---------------------------------------------------------------------------
const LOCAL_STORAGE_KEY = "eu_seed";

let eu_seed = localStorage.getItem(LOCAL_STORAGE_KEY);
if (!eu_seed) {
  eu_seed = Date.now().toString();
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, eu_seed);
  } catch (_) {
    /* In private mode `localStorage` might be disabled – that is okay. */
  }
}

// Convert seed string → four 32-bit ints suitable for sfc32
const seed_ints = cyrb128(eu_seed);
const rand      = sfc32(seed_ints[0], seed_ints[1], seed_ints[2], seed_ints[3]);

// ---------------------------------------------------------------------------
// 4 · Public API --------------------------------------------------------------
// ---------------------------------------------------------------------------
if (typeof window !== "undefined") {
  window.rand     = rand;
  window.eu_seed  = eu_seed;
}

export { rand, eu_seed };