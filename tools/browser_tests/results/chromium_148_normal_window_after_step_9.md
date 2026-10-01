# Chromium 148, normal window, after step 9

Run on 2026-10-01 by the user on the laptop in Chromium (the user agent names it Chrome), with the page that applies the frame's rotation and flip; pasted verbatim from the test page.

Browser: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36
Window mode: normal window
Candidate pipeline: createImageBitmap, VideoFrame.copyTo as RGBA, the frame's rotation and flip applied, own PNG encoder

| Group | Test | Result | Verdict |
|---|---|---|---|
| Support | createImageBitmap exists | yes | ✓ |
| Support | VideoFrame exists | yes | ✓ |
| Support | VideoFrame from an ImageBitmap, copyTo as RGBA | frame format BGRA, coded 8×4, display 8×4, rotation 0, flip false; against the pattern: max difference 0, differing values 0 | ✓ |
| Support | CompressionStream("deflate") produces ZLIB | first byte 0x78 | ✓ |
| Pipeline | JPEG: candidate decode matches <img> | 64×32, frame format BGRX, coded 64×32, display 64×32, rotation 0, flip false; against <img>, read back through the canvas: max difference 1, differing values 218, mean 0.0266 | info |
| Pipeline | JPEG: two candidate decodes are identical | yes | ✓ |
| Pipeline | JPEG: candidate decode against the bitmap drawn on a canvas | max difference 0, differing values 0, mean 0.0000 | info |
| Pipeline | JPEG: own PNG round trip is exact and has only IHDR, IDAT, IEND | chunks IHDR IDAT IEND; max difference 0, differing values 0; 0.2 KiB | ✓ |
| Pipeline | WebP: candidate decode matches <img> | 64×32, frame format BGRX, coded 64×32, display 64×32, rotation 0, flip false; against <img>, read back through the canvas: max difference 0, differing values 0, mean 0.0000 | info |
| Pipeline | WebP: two candidate decodes are identical | yes | ✓ |
| Pipeline | WebP: candidate decode against the bitmap drawn on a canvas | max difference 0, differing values 0, mean 0.0000 | info |
| Pipeline | WebP: own PNG round trip is exact and has only IHDR, IDAT, IEND | chunks IHDR IDAT IEND; max difference 0, differing values 0; 0.2 KiB | ✓ |
| Pipeline | WebP with alpha: candidate decode matches <img> | 16×4, frame format BGRA, coded 16×4, display 16×4, rotation 0, flip false; against <img>, read back through the canvas: max difference 255, differing values 40, mean 8.2500 | info |
| Pipeline | WebP with alpha: two candidate decodes are identical | yes | ✓ |
| Pipeline | WebP with alpha: candidate decode against the bitmap drawn on a canvas | max difference 0, differing values 0, mean 0.0000 | info |
| Pipeline | WebP with alpha: own PNG round trip is exact and has only IHDR, IDAT, IEND | chunks IHDR IDAT IEND; max difference 0, differing values 0; 0.1 KiB | ✓ |
| Pipeline | PNG RGBA with alpha 0, 1, 128, 254 (not converted by Imaginer; measures the verification path): candidate decode is exact | 16×4, frame format BGRA, coded 16×4, display 16×4, rotation 0, flip false; max difference 200, differing values 80 | ✗ |
| Pipeline | PNG RGBA with alpha 0, 1, 128, 254 (not converted by Imaginer; measures the verification path): two candidate decodes are identical | yes | ✓ |
| Pipeline | PNG RGBA with alpha 0, 1, 128, 254 (not converted by Imaginer; measures the verification path): candidate decode against the bitmap drawn on a canvas | max difference 0, differing values 0, mean 0.0000 | info |
| Pipeline | PNG RGBA with alpha 0, 1, 128, 254 (not converted by Imaginer; measures the verification path): own PNG round trip is exact and has only IHDR, IDAT, IEND | chunks IHDR IDAT IEND; max difference 0, differing values 0; 0.1 KiB | ✓ |
| Orientation | JPEG, EXIF orientation 1: candidate output shows what <img> shows | candidate shows 1, <img> shows 1, bitmap on canvas shows 1 | ✓ |
| Orientation | JPEG, EXIF orientation 2: candidate output shows what <img> shows | candidate shows 2, <img> shows 2, bitmap on canvas shows 2 | ✓ |
| Orientation | JPEG, EXIF orientation 3: candidate output shows what <img> shows | candidate shows 3, <img> shows 3, bitmap on canvas shows 3 | ✓ |
| Orientation | JPEG, EXIF orientation 4: candidate output shows what <img> shows | candidate shows 4, <img> shows 4, bitmap on canvas shows 4 | ✓ |
| Orientation | JPEG, EXIF orientation 5: candidate output shows what <img> shows | candidate shows 5, <img> shows 5, bitmap on canvas shows 5 | ✓ |
| Orientation | JPEG, EXIF orientation 6: candidate output shows what <img> shows | candidate shows 6, <img> shows 6, bitmap on canvas shows 6 | ✓ |
| Orientation | JPEG, EXIF orientation 7: candidate output shows what <img> shows | candidate shows 7, <img> shows 7, bitmap on canvas shows 7 | ✓ |
| Orientation | JPEG, EXIF orientation 8: candidate output shows what <img> shows | candidate shows 8, <img> shows 8, bitmap on canvas shows 8 | ✓ |
| Orientation | WebP, EXIF orientation 1: candidate output shows what <img> shows | candidate shows 1, <img> shows 1, bitmap on canvas shows 1 | ✓ |
| Orientation | WebP, EXIF orientation 6: candidate output shows what <img> shows | candidate shows 1, <img> shows 1, bitmap on canvas shows 1 | ✓ |
| Canvas | getImageData returns the drawn pixels exactly | max difference 0, differing values 0 | ✓ |
| Canvas | toBlob PNG chunks | IHDR IDAT IDAT IEND | info |
| Canvas | toBlob PNG pixels are exact | max difference 0, differing values 0 | ✓ |
| Canvas | two toBlob PNGs of the same canvas are byte-identical | yes | info |
| Canvas | mask PNG keeps its alpha exactly | chunks IHDR IDAT IDAT IEND; alpha: max difference 0, differing values 0; all channels: max difference 0, differing values 0 | ✓ |
| Timing | 12 MP JPEG: candidate decode, own PNG encode, verify | decode 251 ms, encode 494 ms, verify 248 ms, total 993 ms; PNG 2.0 MiB; max difference 0, differing values 0 | ✓ |
