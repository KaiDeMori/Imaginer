# Chromium 148, normal window

Run on 2026-09-30 by the user in Chromium (the user agent names it Chrome); pasted verbatim from the test page. The window mode was not chosen in the list; the run used a normal window. The frame counts of 0 are a flaw of the page, which read the track before it was ready.

Browser: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36
Window mode: not chosen

| Group | Test | Result | Verdict |
|---|---|---|---|
| Support | ImageDecoder exists | yes | ✓ |
| Support | ImageDecoder supports image/jpeg | yes | ✓ |
| Support | ImageDecoder supports image/png | yes | ✓ |
| Support | ImageDecoder supports image/webp | yes | ✓ |
| Support | CompressionStream("deflate") produces ZLIB | first byte 0x78 | ✓ |
| Pipeline | PNG RGBA with alpha 0, 1, 128, 254: ImageDecoder decodes exactly | 16×4, 0 frame(s), frame format BGRA, coded 16×4, display 16×4, rotation 0, flip false; max difference 200, differing values 80 | ✗ |
| Pipeline | PNG RGBA with alpha 0, 1, 128, 254: own PNG round trip is exact and has only IHDR, IDAT, IEND | chunks IHDR IDAT IEND; max difference 0, differing values 0; 0.1 KiB | ✓ |
| Pipeline | PNG palette with tRNS: ImageDecoder decodes exactly | 16×8, 0 frame(s), frame format BGRA, coded 16×8, display 16×8, rotation 0, flip false; max difference 240, differing values 128 | ✗ |
| Pipeline | PNG palette with tRNS: own PNG round trip is exact and has only IHDR, IDAT, IEND | chunks IHDR IDAT IEND; max difference 0, differing values 0; 0.1 KiB | ✓ |
| Pipeline | PNG with 16 bits per sample: ImageDecoder decodes exactly | 16×8, 0 frame(s), frame format BGRA, coded 16×8, display 16×8, rotation 0, flip false; max difference 0, differing values 0 | ✓ |
| Pipeline | PNG with 16 bits per sample: own PNG round trip is exact and has only IHDR, IDAT, IEND | chunks IHDR IDAT IEND; max difference 0, differing values 0; 0.1 KiB | ✓ |
| Pipeline | animated PNG, 2 frames (first frame): ImageDecoder decodes exactly | 16×8, 0 frame(s), frame format BGRA, coded 16×8, display 16×8, rotation 0, flip false; max difference 0, differing values 0 | ✓ |
| Pipeline | animated PNG, 2 frames (first frame): own PNG round trip is exact and has only IHDR, IDAT, IEND | chunks IHDR IDAT IEND; max difference 0, differing values 0; 0.1 KiB | ✓ |
| Pipeline | JPEG: ImageDecoder decodes like <img> | 64×32, 0 frame(s), frame format I420, coded 64×32, display 64×32, rotation 0, flip false; against <img>, read back through the canvas: max difference 107, differing values 1494, mean 2.1974 | info |
| Pipeline | JPEG: own PNG round trip is exact and has only IHDR, IDAT, IEND | chunks IHDR IDAT IEND; max difference 0, differing values 0; 0.1 KiB | ✓ |
| Pipeline | WebP: ImageDecoder decodes like <img> | 64×32, 0 frame(s), frame format BGRX, coded 64×32, display 64×32, rotation 0, flip false; against <img>, read back through the canvas: max difference 0, differing values 0, mean 0.0000 | info |
| Pipeline | WebP: own PNG round trip is exact and has only IHDR, IDAT, IEND | chunks IHDR IDAT IEND; max difference 0, differing values 0; 0.2 KiB | ✓ |
| Orientation | JPEG, EXIF orientation 1: ImageDecoder output is upright | ImageDecoder shows 1, <img> shows 1, createImageBitmap shows 1 | ✓ |
| Orientation | JPEG, EXIF orientation 2: ImageDecoder output is upright | ImageDecoder shows 1, <img> shows 2, createImageBitmap shows 2 | ✗ |
| Orientation | JPEG, EXIF orientation 3: ImageDecoder output is upright | ImageDecoder shows 1, <img> shows 3, createImageBitmap shows 3 | ✗ |
| Orientation | JPEG, EXIF orientation 4: ImageDecoder output is upright | ImageDecoder shows 1, <img> shows 4, createImageBitmap shows 4 | ✗ |
| Orientation | JPEG, EXIF orientation 5: ImageDecoder output is upright | ImageDecoder shows 1, <img> shows 5, createImageBitmap shows 5 | ✗ |
| Orientation | JPEG, EXIF orientation 6: ImageDecoder output is upright | ImageDecoder shows 1, <img> shows 6, createImageBitmap shows 6 | ✗ |
| Orientation | JPEG, EXIF orientation 7: ImageDecoder output is upright | ImageDecoder shows 1, <img> shows 7, createImageBitmap shows 7 | ✗ |
| Orientation | JPEG, EXIF orientation 8: ImageDecoder output is upright | ImageDecoder shows 1, <img> shows 8, createImageBitmap shows 8 | ✗ |
| Orientation | WebP, EXIF orientation 1: ImageDecoder output is upright | ImageDecoder shows 1, <img> shows 1, createImageBitmap shows 1 | ✓ |
| Orientation | WebP, EXIF orientation 6: ImageDecoder output is upright | ImageDecoder shows 1, <img> shows 1, createImageBitmap shows 1 | ✗ |
| Orientation | PNG (eXIf), EXIF orientation 1: ImageDecoder output is upright | ImageDecoder shows 1, <img> shows 1, createImageBitmap shows 1 | ✓ |
| Orientation | PNG (eXIf), EXIF orientation 6: ImageDecoder output is upright | ImageDecoder shows 1, <img> shows 6, createImageBitmap shows 6 | ✗ |
| Canvas | getImageData returns the drawn pixels exactly | max difference 0, differing values 0 | ✓ |
| Canvas | toBlob PNG chunks | IHDR IDAT IDAT IEND | info |
| Canvas | toBlob PNG pixels are exact | max difference 0, differing values 0 | ✓ |
| Canvas | two toBlob PNGs of the same canvas are byte-identical | yes | info |
| Canvas | mask PNG keeps its alpha exactly | chunks IHDR IDAT IDAT IEND; alpha: max difference 0, differing values 0; all channels: max difference 0, differing values 0 | ✓ |
| Timing | 12 MP JPEG: decode, own PNG encode, verify | decode 169 ms, encode 475 ms, verify 187 ms, total 831 ms; PNG 1.5 MiB; max difference 0, differing values 0 | ✓ |
