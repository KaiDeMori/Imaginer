# Responses API Integration Planning (Revised)

## 1. General Idea

The goal is to integrate the new OpenAI Responses API (Conversational API) into Imaginer. We will introduce a configuration-based mode switch to toggle between the classic "Generation" mode and the new "Conversation" mode.

-   **Generation Mode**: Retains the existing functionality (single-shot generation/editing) using the `Generation_panel`.
-   **Conversation Mode**: A new stateful interface for multi-turn interactions, allowing for iterative editing and refinement of images within a conversation context, using the `Conversation_panel`.

The application will display **either** the Generation Panel **or** the Conversation Panel based on the `imaginer.mode` configuration key. They will never be shown simultaneously.

## 2. Detailed Breakdown

### 2.1. User Interface (UI)

#### A. Mode Switching
-   **Config Key**: `imaginer.mode` (values: `"generation"` or `"conversation"`).
-   **Behavior**: On startup (and potentially on config change), the app checks this key.
    -   If `"generation"`: The `Generation_panel` is rendered in the main content area.
    -   If `"conversation"`: The `Conversation_panel` is rendered in the main content area, replacing the `Generation_panel`.

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
        -   **"Add to Gallery" Button**: Each generated image in the chat will have a button to save it to the main application gallery (and `Session_store`).
-   **Image Input Area**:
    -   Reuses the current drag-and-drop component (likely leveraging `drop_area_manager.js` or similar logic) to handle image uploads for the conversation context.
-   **Conversation Prompt**:
    -   Compact text input area with a "Send" button.

#### C. Conversation Management
-   **"New Conversation" Button**: Located in the `Conversation_panel` header (if applicable) or accessible via a clear UI element. Clears the current view and resets the conversation ID.
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
    -   **Input**: Images dropped into the input area need to be uploaded or passed as base64/URLs. The Responses API supports `file_ids` (via the Files API) or direct image inputs. Using the Files API might be cleaner for multi-turn edits.
    -   **Output**: Generated images come back in the response. We render them as `blob` URLs.
    -   **Saving**: When "Add to Gallery" is clicked, we take the image blob and pass it to the existing `Session_store.save()` and `Gallery.addThumbnail()` methods.

### 2.3. File Structure Changes

-   `app.js`: Update initialization logic to check `imaginer.mode` and render the appropriate panel.
-   `components/conversation_panel/`:
    -   `conversation_panel.js`
    -   `conversation_panel.html`
    -   `conversation_panel.css`
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