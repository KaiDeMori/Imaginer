import { strip_PNG, write_PNG_prompt } from "./PNG_chunks.js";

/**
 * @param {Blob} blob
 * @param {string} prompt_text
 * @param {{ embed_itxt?: boolean, embed_xmp?: boolean }} embed_options
 * @returns {Promise<Blob>}
 */
export async function process_image_metadata(blob, prompt_text, embed_options = {}) {
  const strip = localStorage.getItem("imaginer.strip_metadata") === "true";
  const iTXt_form = embed_options.embed_itxt ?? localStorage.getItem("imaginer.add_prompt_to_image") === "true";
  const XMP_form = embed_options.embed_xmp ?? localStorage.getItem("imaginer.add_prompt_to_image_xmp") === "true";

  let bytes = new Uint8Array(await blob.arrayBuffer());

  if (strip) {
    try {
      bytes = strip_PNG(bytes);
    } catch (error) {
      console.warn("Failed to strip PNG metadata:", error);
      return blob;
    }
  }

  try {
    bytes = write_PNG_prompt(bytes, prompt_text, { iTXt_form, XMP_form });
  } catch (error) {
    console.warn("Failed to write the prompt into the PNG:", error);
  }

  return new Blob([bytes], { type: "image/png" });
}
