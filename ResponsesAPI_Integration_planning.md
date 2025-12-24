# Responses API Integration Planning (Revised)

## 1. General Idea

The goal is to integrate the new OpenAI Responses API (Conversational API) into Imaginer. We will introduce a configuration-based mode switch to toggle between the classic "Generation" mode and the new "Conversation" mode.

-   **Generation Mode**: Retains the existing functionality (single-shot generation/editing) using the `Generation_panel`.
-   **Conversation Mode**: A new stateful interface for multi-turn interactions, allowing for iterative editing and refinement of images within a conversation context, using the `Conversation_panel`.

The application will display **either** the Generation Panel **or** the Conversation Panel based on the `imaginer.mode` configuration key. They will never be shown simultaneously.

## 1.1. Model Strategy (Exclusive `gpt-image` Support)

We will exclusively support **`gpt-image`** models (e.g., `gpt-image-1`) for all image generation and editing tasks within the Conversation Mode. We will **ignore** legacy DALL-E models (`dall-e-2`, `dall-e-3`). The Responses API integration will be built specifically around the capabilities of `gpt-image` models, including their advanced instruction following and masking capabilities.

## 2. Detailed Breakdown

### 2.1. User Interface (UI)

#### A. Mode Switching
-   **Config Key**: `imaginer.mode` (values: `"generation"` or `"conversation"`).
-   **Behavior**: On startup, the app checks this key.
    -   If `"generation"`: The `Generation_panel` is rendered in the main content area.
    -   If `"conversation"`: The `Conversation_panel` is rendered in the main content area, replacing the `Generation_panel`.
-   **Reload Requirement**: Changing the mode via configuration will always trigger a full application reload. There is no dynamic switching between modes at runtime.

#### B. Conversation Panel Component (`components/conversation_panel/conversation_panel.js`)
This new component will replace the `Generation_panel` when in conversation mode.
-   **Structure**:
    1.  **Conversation History** (Top, scrollable): Displays messages and images.
    2.  **Image Input Area** (Middle): Reuses the existing drag-and-drop logic/component.
    3.  **Vertical Moveable Divider**: Separates the upper area from the prompt area.
    4.  **Prompt Area** (Bottom): Textfield and Send button.
-   **Layout Constraints**:
    -   **No unnecessary paddings or margins** for the drag-and-drop area, prompt area, and send key to maximize space and maintain a clean look.
    -   **Resizable Prompt Area**: The divider allows the user to adjust the height of the prompt area for longer inputs.
-   **Conversation History**:
    -   Displays user messages and model responses.
    -   **Images**:
        -   Displayed inline within the chat bubble.
        -   **"Add to Gallery" Button**: Each generated image in the chat will have a button to save it to the main application gallery (and `Database_store`).
-   **Image Input Area**:
    -   **Logic**: Reuses the existing `drop_area_manager.js` singleton to manage file state, mask association (first image only), and UUIDs. This ensures consistent behavior for mask handling across the app.
    -   **UI**: Uses a new component `conversation_drop_area.js` (instead of `drop_area.js`) to render the drop zone and thumbnails specifically for the conversation layout. This decouples the visual presentation from the Generation Panel while sharing the robust underlying logic.
-   **Conversation Prompt**:
    -   Compact text input area with a "Send" button.

#### C. Conversation Management
-   **"New Conversation" Button**: Located in the main **Menu Bar** (icon: 🆕). Clears the current view and resets the conversation ID.
-   **Persistence**: We will rely on OpenAI's server-side conversation storage. The client only needs to persist the current `conversation_id` (e.g., in `localStorage`) to resume the session after a page reload.

### 2.2. Logic & Data Flow

#### A. Client-Side State
-   **`imaginer.mode`**: Configuration key determining the active view.
-   **`current_conversation_id`**: Stores the ID of the active conversation.
-   **`conversation_items`**: Local cache of the current conversation's messages/items to render the UI.

#### B. API Integration (The "Client")
Since we are not using the OpenAI Node SDK, we will implement raw `fetch` calls to the new endpoints.

1.  **Create/Continue Conversation (`POST /v1/responses`)**:
    -   **Endpoint**: `https://api.openai.com/v1/responses`
    -   **Body**:
        ```json
        {
          "model": "gpt-4o", // The driving model
          "tools": [{ "type": "image_generation" }], // Enable image capabilities
          "conversation_id": "conv_...", // Omit for new conversation
          "input": [
            { "type": "text", "text": "Make it look like a painting." },
            { "type": "image_url", "image_url": { "url": "..." } } // Or file ID
          ]
        }
        ```
    -   **Handling Response**:
        -   The API returns a `response` object containing the model's output (text or tool calls).
        -   If the model calls `image_generation`, the API handles the generation and returns the image data (or a reference).
        -   We need to parse this response, update the UI, and store the `conversation_id` if it's new.

2.  **Image Handling**:
    -   **Input**: Images dropped into the input area are handled via the Files API.
        -   **Gallery Images**: We check if the image record already has an `openai_file_id`. If yes, we reuse it. If no, we upload it and update the record with the new ID.
        -   **External Images**: Always uploaded as new files.
    -   **Output**: Generated images come back in the response. We render them as `blob` URLs.
    -   **Saving**: When "Add to Gallery" is clicked, we take the image blob and pass it to the existing `Database_store.save()` and `Gallery.create_or_update_thumbnail()` methods.

### 2.3. File Structure Changes

-   `app.js`: Update initialization logic to check `imaginer.mode` and render the appropriate panel.
-   `components/menu_bar/`:
    -   `menu_bar.js`: Add logic to toggle conversation buttons.
    -   `menu_bar.html`: Add "New Conversation" and "History" buttons.
-   `components/conversation_panel/`:
    -   `conversation_panel.js`
    -   `conversation_panel.html`
    -   `conversation_panel.css`
    -   `conversation_drop_area.js` (New UI logic for drop zone)
-   `components/conversation_history/`:
    -   `conversation_history.js`
    -   `conversation_history.html`
    -   `conversation_history.css`
-   `api/responses_client.js`: (New) A dedicated module to handle the raw `fetch` calls for the Responses API.

## 3. Feasibility Analysis & Thoughts

### Feasibility
-   **High Feasibility**: The mode switch simplifies the UI logic compared to tabs.
-   **Technical Fit**: Reusing the drag-and-drop component ensures consistency.
-   **API Alignment**: The Responses API is designed exactly for this "stateful" interaction.

### Thoughts & Recommendations
1.  **Model Selection**: The Responses API uses a "driving model" (like `gpt-4o`) which then calls the image tool.
2.  **"Chat" vs. "Conversation"**: Strictly adhering to "Conversation" terminology is good.
3.  **Image Inputs**: For the "edit this image" workflow in a conversation, we should decide if we upload the image to OpenAI's Files API first (better for persistence) or send it as base64 in the message.
4.  **Streaming**: The Responses API supports streaming. Implementing this would make the UI feel much snappier. Ignore for now.

### Next Steps
* [] create a mock-up of the UI

## 4. Gallery Integration & History Management

To provide access to past conversations without a dedicated sidebar, we will integrate conversation history directly into the Gallery.

### 4.1. Data Model Updates
-   **`Database_store`**: Update the schema (implicitly) to store `conversation_id` and `openai_file_id` alongside existing image metadata.
    -   New field: `conversation_id` (string, optional).
    -   New field: `openai_file_id` (string, optional). Stores the ID returned by OpenAI's Files API to avoid re-uploading the same image.
    -   **`prompt_text`**: For images generated in Conversation Mode, this field will be left **empty** or `null`. We do not attempt to infer a single prompt from a multi-turn conversation.
    -   **Exclusivity Rule**: An image should ideally have EITHER `prompt_text` OR `conversation_id`. If both are present (e.g. due to a bug or migration), `conversation_id` takes precedence, and `prompt_text` is removed.

### 4.2. Gallery UI Changes
-   **Indicators**: The hover overlay on gallery thumbnails will be updated to show distinct icons based on available metadata:
    1.  **Speech Bubble (💬)**: Displayed ONLY if `prompt_text` is present AND `conversation_id` is missing.
        -   *Behavior*: Copies the text to the active input area.
    2.  **Chat Bubbles (🗨️)**: Displayed if `conversation_id` is present (even if `prompt_text` exists).
        -   *Behavior*: Context-dependent (see below).

### 4.3. Cross-Mode Interaction Logic

#### A. In Generation Mode
-   **Images with `prompt_text`**: Show Speech Bubble (💬). Clicking fills the prompt box.
-   **Images with `conversation_id`**: Show Chat Bubbles (🗨️).
    -   **State**: Disabled / Informational only.
    -   **Tooltip**: "Created in Conversation Mode".
    -   **Click Action**: **None** (or shows a simple toast message). We do NOT prompt for reload or mode switch. The user must manually change the mode in settings if they wish to resume the conversation.

#### B. In Conversation Mode
-   **Images with `conversation_id`**: Show Chat Bubbles (🗨️).
    -   **Click Action**: Clears the current view and loads the history associated with that `conversation_id`.
-   **Images with `prompt_text`**: Show Speech Bubble (💬).
    -   **Click Action**: Copies the prompt text into the chat input box as a draft message.

### 4.4. Implementation Steps
1.  **Update `Database_store`**: Ensure `conversation_id` is passed and saved during image generation in `Conversation_panel`. Ensure `prompt_text` is empty for these images.
2.  **Update `Gallery`**:
    -   Modify `create_or_update_thumbnail` to accept `conversation_id`.
    -   Logic to render 💬 vs 🗨️ based on data presence.
    -   Implement the click handlers with the strict mode checks described above.

## 5. Conversation History Management

To address the edge case of "lost" conversations (those with no saved images), we will implement a dedicated **Conversation History** interface.

### 5.1. Storage Strategy (Local Registry)
Since the Responses API does not provide an endpoint to list all past conversations, we must maintain a **local registry** of conversation metadata.
-   **Storage Location**: **IndexedDB** (via the existing `Database_store` class).
    -   We will add a new object store (table) named `conversation_history` to the existing database.
-   **Schema**:
    ```json
    {
      "id": "conv_123...",
      "created_at": 1716900000,
      "last_active": 1716900500,
      "title": "Blue Dinosaur Edit", // Derived from first user message or generated
      "preview": "Make it look like a painting..." // First few words
    }
    ```
-   **Update Logic**:
    -   **On Creation**: When a new `conversation_id` is received from the API, add an entry.
    -   **On Message**: Update `last_active` and potentially `title` (if we implement auto-titling).

### 5.2. UI: The History Overlay
Instead of a new browser tab (which introduces complexity with cross-tab communication and popup blockers), we will use a **Full-Screen Overlay** within the application.
-   **Access**: A "History" button (icon: 📜) next to the "New Conversation" button in the **Menu Bar**.
-   **Appearance**: A modal/overlay covering the main content area.
    -   **Header**: "Conversation History" + Close button.
    -   **List**: Scrollable list of conversation cards.
        -   **Card Content**: Title, Date, Preview text.
        -   **Actions**: "Open", "Delete".
-   **Behavior**:
    -   Clicking a card closes the overlay and loads that conversation.
    -   Clicking "Delete" removes it from the registry (and ideally clears local cache).

### 5.3. Implementation Steps
1.  **Update `Database_store`**: Add methods `add_conversation_metadata(meta)`, `get_all_conversations()`, `delete_conversation(id)`.
2.  **Update `Conversation_panel`**:
    -   Call `Database_store.add_conversation_metadata` when a new conversation starts.
    -   Add the "History" button to the header.
    -   Implement the `History_overlay` component (or simple HTML injection) to render the list.