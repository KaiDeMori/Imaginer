// Surfboard: on localhost, window.imaginer_surfboard lets a script ride Imaginer without a mouse. Every function takes the path a user takes, and Generate stays a real click, so a paid request never hides in here.

const DROP_AREA_SELECTOR = "#input-image-drop-area";
const WAIT_STEP_MS = 100;
const WAIT_LIMIT_MS = 5000;

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function count_input_images() {
  return document.querySelectorAll(`${DROP_AREA_SELECTOR} img`).length;
}

/**
 * Every gallery picture, newest first, in the gallery's order.
 * @returns {Promise<Array<{ id: number, created: string, prompt: string, has_mask: boolean }>>}
 */
async function list_records() {
  const records = await window.database_store.get_all({ reverse: true });
  return records.map((record) => ({
    id: record.id,
    created: new Date(record.created * 1000).toISOString(),
    prompt: (record.prompt_text || "").slice(0, 80),
    has_mask: record.mask_blob instanceof Blob,
  }));
}

/**
 * Puts a gallery picture into the drop area along the path of a real gallery drag: the thumbnail's own dragstart packs it, mask included, and the drop area's own drop takes it.
 * @param {number} record_id
 * @returns {Promise<number>} the number of images in the drop area afterwards
 */
async function add_to_input_area(record_id) {
  const thumbnail = document.querySelector(`.gallery-thumb[data-record-id="${record_id}"]`);
  if (thumbnail === null) throw new Error(`The gallery shows no picture with the ID ${record_id}.`);
  const drop_area = document.querySelector(DROP_AREA_SELECTOR);
  const count_before = count_input_images();
  const options = { dataTransfer: new DataTransfer(), bubbles: true, cancelable: true };
  thumbnail.dispatchEvent(new DragEvent("dragstart", options));
  drop_area.dispatchEvent(new DragEvent("dragenter", options));
  drop_area.dispatchEvent(new DragEvent("dragover", options));
  drop_area.dispatchEvent(new DragEvent("drop", options));
  thumbnail.dispatchEvent(new DragEvent("dragend", options));
  // The drop area adds the picture after loading its modules, so the count is awaited; a refused picture leaves it unchanged.
  for (let waited = 0; waited < WAIT_LIMIT_MS && count_input_images() === count_before; waited += WAIT_STEP_MS) {
    await wait(WAIT_STEP_MS);
  }
  return count_input_images();
}

/**
 * Sets the prompt as typing would, so the prompt panel saves it.
 * @param {string} text
 */
function set_prompt(text) {
  const prompt_input = document.querySelector("#prompt-input");
  prompt_input.value = text;
  prompt_input.dispatchEvent(new Event("input", { bubbles: true }));
}

export function install_surfboard() {
  window.imaginer_surfboard = { list_records, add_to_input_area, set_prompt };
}
