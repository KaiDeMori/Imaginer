import { strip_metadata_from_PNG } from "./strip_metadata_from_PNG/strip_metadata_from_PNG.js";
import { add_iTXt_chunk_to_png } from "./png_iTXt/png_iTXt.js";
import { embed_XMP_description } from "./png_XMP_via_iTXt/png-XMP-embedder.js";

/**
 * @param {Blob} blob
 * @param {string} prompt_text
 * @param {{ embed_itxt?: boolean, embed_xmp?: boolean }} embed_options
 * @returns {Promise<Blob>}
 */
export async function process_image_metadata(blob, prompt_text, embed_options = {}) {
  const strip_metadata = localStorage.getItem("imaginer.strip_metadata") === "true";
  if (strip_metadata) {
    const arrayBuffer = await blob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    try {
      blob = strip_metadata_from_PNG(uint8Array);
    } catch (err) {
      console.warn("Failed to strip PNG metadata:", err);
    }
  }

  const embed_itxt = embed_options.embed_itxt ?? localStorage.getItem("imaginer.add_prompt_to_image") === "true";
  const embed_xmp = embed_options.embed_xmp ?? localStorage.getItem("imaginer.add_prompt_to_image_xmp") === "true";

  if (embed_itxt || embed_xmp) {
    const reader = new FileReader();
    const data_url = await new Promise((resolve, reject) => {
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    try {
      if (embed_itxt) {
        blob = await add_iTXt_chunk_to_png(data_url, prompt_text, "prompt_text");
      }
      if (embed_xmp) {
        blob = await embed_XMP_description(
          embed_itxt
            ? await new Promise((resolve, reject) => {
                const r2 = new FileReader();
                r2.onload = () => resolve(r2.result);
                r2.onerror = reject;
                r2.readAsDataURL(blob);
              })
            : data_url,
          prompt_text,
        );
      }
    } catch (err) {
      console.warn("Failed to embed prompt metadata:", err);
    }
  }

  return blob;
}
