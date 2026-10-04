// Surfboard: on localhost, window.imaginer_surfboard lets a script ride Imaginer without a mouse. Every function takes the path a user takes, and Generate stays a real click, so a paid request never hides in here.

const DROP_AREA_SELECTOR = "#input-image-drop-area";
const WAIT_STEP_MS = 100;
const WAIT_LIMIT_MS = 5000;
const SURFER_BAR_ID = "surfer_bar";
const SURFER_BAR_COLOURS = { surfing: "#0b5cad", stopped: "#b3261e", finished: "#2e7d32" };

let surfer_bar_element = null;
let surfer_bar_text = null;
let stop_requested = false;

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

// The surfer bar shows the person watching what the script is doing, and its 🛑 button lets them stop it before the next step.
function ensure_surfer_bar() {
  if (surfer_bar_element !== null) return;
  surfer_bar_element = document.createElement("div");
  surfer_bar_element.id = SURFER_BAR_ID;
  Object.assign(surfer_bar_element.style, {
    position: "fixed",
    top: "8px",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: "20000",
    color: "#fff",
    padding: "6px 12px",
    borderRadius: "8px",
    font: "600 14px system-ui, sans-serif",
    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.3)",
    display: "flex",
    gap: "10px",
    alignItems: "center",
  });
  surfer_bar_text = document.createElement("span");
  const stop_button = document.createElement("button");
  stop_button.textContent = "🛑";
  stop_button.title = "Stop the surfer before the next step";
  Object.assign(stop_button.style, { border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px", padding: "2px 6px" });
  stop_button.addEventListener("click", () => {
    stop_requested = true;
    surfer_bar_text.textContent = "🛑 Stop requested: the surfer stops before the next step";
    surfer_bar_element.style.background = SURFER_BAR_COLOURS.stopped;
  });
  surfer_bar_element.append(surfer_bar_text, stop_button);
  document.body.appendChild(surfer_bar_element);
}

/**
 * Shows the surfer bar in blue with the message. After a stop request, the bar keeps the stop message until the ride is finished.
 * @param {string} message
 */
function show_surfer_bar(message) {
  ensure_surfer_bar();
  if (stop_requested) return;
  surfer_bar_text.textContent = message;
  surfer_bar_element.style.background = SURFER_BAR_COLOURS.surfing;
}

/**
 * Ends the ride: the surfer bar turns green with the message, and the stop request is cleared.
 * @param {string} message
 */
function finish_surfer_bar(message) {
  ensure_surfer_bar();
  stop_requested = false;
  surfer_bar_text.textContent = message;
  surfer_bar_element.style.background = SURFER_BAR_COLOURS.finished;
}

/**
 * Whether someone pressed 🛑 since the last finished ride. A script checks it before every step.
 */
function is_stop_requested() {
  return stop_requested;
}

export function install_surfboard() {
  window.imaginer_surfboard = { list_records, add_to_input_area, set_prompt, show_surfer_bar, finish_surfer_bar, is_stop_requested };
}
