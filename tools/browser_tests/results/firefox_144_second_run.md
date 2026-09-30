# Firefox 144, second run

Run on 2026-09-30 by the user; pasted verbatim from the test page.
The page said "normal window", but the canvas noise points to a private window or Strict mode; the window mode is to be confirmed. The timing row is missing because the results were copied before the run had finished.

Browser: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:144.0) Gecko/20100101 Firefox/144.0
Window mode: normal window

| Group | Test | Result | Verdict |
|---|---|---|---|
| Support | ImageDecoder exists | yes | ✓ |
| Support | ImageDecoder supports image/jpeg | yes | ✓ |
| Support | ImageDecoder supports image/png | yes | ✓ |
| Support | ImageDecoder supports image/webp | yes | ✓ |
| Support | CompressionStream("deflate") produces ZLIB | first byte 0x78 | ✓ |
| Pipeline | PNG RGBA with alpha 0, 1, 128, 254: ImageDecoder decodes exactly | 16×4, 1 frame(s), frame format BGRA, coded 16×4, display 16×4; max difference 200, differing values 120 | ✗ |
| Pipeline | PNG RGBA with alpha 0, 1, 128, 254: own PNG round trip is exact and has only IHDR, IDAT, IEND | chunks IHDR IDAT IEND; max difference 55, differing values 72; 0.1 KiB | ✗ |
| Pipeline | PNG palette with tRNS: ImageDecoder decodes exactly | 16×8, 1 frame(s), frame format BGRA, coded 16×8, display 16×8; max difference 240, differing values 192 | ✗ |
| Pipeline | PNG palette with tRNS: own PNG round trip is exact and has only IHDR, IDAT, IEND | chunks IHDR IDAT IEND; max difference 55, differing values 96; 0.1 KiB | ✗ |
| Pipeline | PNG with 16 bits per sample: ImageDecoder decodes exactly | 16×8, 1 frame(s), frame format BGRA, coded 16×8, display 16×8; max difference 0, differing values 0 | ✓ |
| Pipeline | PNG with 16 bits per sample: own PNG round trip is exact and has only IHDR, IDAT, IEND | chunks IHDR IDAT IEND; max difference 0, differing values 0; 0.1 KiB | ✓ |
| Pipeline | animated PNG, 2 frames (first frame): ImageDecoder decodes exactly | 16×8, 2 frame(s), frame format BGRA, coded 16×8, display 16×8; max difference 0, differing values 0 | ✓ |
| Pipeline | animated PNG, 2 frames (first frame): own PNG round trip is exact and has only IHDR, IDAT, IEND | chunks IHDR IDAT IEND; max difference 0, differing values 0; 0.1 KiB | ✓ |
| Pipeline | JPEG: ImageDecoder decodes like <img> | 64×32, 1 frame(s), frame format BGRX, coded 64×32, display 64×32; against <img>: max difference 2, differing values 85, mean 0.0153 | info |
| Pipeline | JPEG: own PNG round trip is exact and has only IHDR, IDAT, IEND | chunks IHDR IDAT IEND; max difference 0, differing values 0; 0.2 KiB | ✓ |
| Pipeline | WebP: ImageDecoder decodes like <img> | 64×32, 1 frame(s), frame format BGRX, coded 64×32, display 64×32; against <img>: max difference 2, differing values 187, mean 0.0337 | info |
| Pipeline | WebP: own PNG round trip is exact and has only IHDR, IDAT, IEND | chunks IHDR IDAT IEND; max difference 0, differing values 0; 0.2 KiB | ✓ |
| Orientation | JPEG, EXIF orientation 1: ImageDecoder output is upright | ImageDecoder shows 1, <img> shows 1, createImageBitmap shows 1 | ✓ |
| Orientation | JPEG, EXIF orientation 2: ImageDecoder output is upright | ImageDecoder shows 2, <img> shows 2, createImageBitmap shows 2 | ✓ |
| Orientation | JPEG, EXIF orientation 3: ImageDecoder output is upright | ImageDecoder shows 3, <img> shows 3, createImageBitmap shows 3 | ✓ |
| Orientation | JPEG, EXIF orientation 4: ImageDecoder output is upright | ImageDecoder shows 4, <img> shows 4, createImageBitmap shows 4 | ✓ |
| Orientation | JPEG, EXIF orientation 5: ImageDecoder output is upright | ImageDecoder shows 5, <img> shows 5, createImageBitmap shows 5 | ✓ |
| Orientation | JPEG, EXIF orientation 6: ImageDecoder output is upright | ImageDecoder shows 6, <img> shows 6, createImageBitmap shows 6 | ✓ |
| Orientation | JPEG, EXIF orientation 7: ImageDecoder output is upright | ImageDecoder shows 7, <img> shows 7, createImageBitmap shows 7 | ✓ |
| Orientation | JPEG, EXIF orientation 8: ImageDecoder output is upright | ImageDecoder shows 8, <img> shows 8, createImageBitmap shows 8 | ✓ |
| Orientation | WebP, EXIF orientation 1: ImageDecoder output is upright | ImageDecoder shows 1, <img> shows 1, createImageBitmap shows 1 | ✓ |
| Orientation | WebP, EXIF orientation 6: ImageDecoder output is upright | ImageDecoder shows 1, <img> shows 1, createImageBitmap shows 1 | ✗ |
| Orientation | PNG (eXIf), EXIF orientation 1: ImageDecoder output is upright | ImageDecoder shows 1, <img> shows 1, createImageBitmap shows 1 | ✓ |
| Orientation | PNG (eXIf), EXIF orientation 6: ImageDecoder output is upright | ImageDecoder shows 6, <img> shows 6, createImageBitmap shows 6 | ✓ |
| Canvas | getImageData returns the drawn pixels exactly | max difference 2, differing values 183 | ✗ |
| Canvas | toBlob PNG chunks | IHDR IDAT IEND | info |
| Canvas | toBlob PNG pixels are exact | max difference 2, differing values 183 | ✗ |
| Canvas | two toBlob PNGs of the same canvas are byte-identical | yes | info |
| Canvas | mask PNG keeps its alpha exactly | chunks IHDR IDAT IEND; max difference 2, differing values 11 | ✗ |
