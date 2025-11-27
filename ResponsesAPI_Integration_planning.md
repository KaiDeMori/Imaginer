# Responses API Integration Planning

## 1. Overview
The goal is to integrate the new OpenAI "Responses API" (conversational capabilities) into Imaginer while preserving the application's current "gallery-centric" feel. The proposed solution involves introducing a tabbed interface above the prompt area, separating the traditional "Generate" workflow from the new "Chat" workflow.

## 2. General Concept: "Two Tabs" Approach

We will modify the main layout to include two tabs above the current prompt/chat box area:
1.  **Generate Tab:** This retains the exact current functionality of Imaginer. It uses the standard `Prompt_panel` and interacts directly with the Gallery.
2.  **Chat Tab:** This introduces a new conversational interface. It features a scrolling conversation history and a dedicated, compact input area.

### Key Features of the Chat Tab
-   **Conversation History:** Displays a linear chat between the User and the Assistant. The Assistant can reply with text and/or generated images.
-   **Local vs. Gallery Images:** Images generated within the chat are "conversation local" by default. They appear in the chat stream but are *not* automatically added to the main Gallery.
-   **"Add to Gallery" Action:** Chat images will have a button/overlay allowing the user to explicitly save them to the main Gallery.
-   **Input Handling:**
    -   **Text:** Standard text input for conversational prompts.
    -   **External Images:** The existing drag-and-drop functionality will be adapted. Dropping an image from the OS into the chat input treats it as an "external" input for the conversation (e.g., for editing or reference).
    -   **Context:** The chat maintains context (history) automatically via the API's `previous_response_id` mechanism.

## 3. Detailed Design & Architecture

### 3.1 UI Components

#### A. Layout Modification (`index.html` / `app.js`)
-   The `#prompt-panel` container will be repurposed or wrapped to host the tab switching logic.
-   A new **Tab Control** will be added at the top of the right-hand pane.

#### B. `Chat_panel` (New Component)
A new class `Chat_panel` will be created, mirroring the structure of `Prompt_panel` but specialized for chat.
-   **Sub-components:**
    -   `Conversation_view`: A scrollable container for messages.
    -   `Chat_input`: A compact version of the prompt box, likely reusing logic from `Prompt_panel` but styled differently (smaller, focused on text flow).

#### C. Message Rendering
-   **User Message:** Displays the prompt text and thumbnails of any input images.
-   **Assistant Message:** Displays text response and/or generated images.
-   **Image Actions:** Images in the chat will have an overlay menu with:
    -   "Add to Gallery" (Triggers `gallery.addThumbnail`).
    -   "View Fullscreen" (Triggers `viewer.open`).

### 3.2 Data Flow & State Management

#### Conversation State
-   **Current Conversation ID:** We need to store the `response_id` of the last message to maintain the thread (`previous_response_id`).
-   **Message History:** While the server maintains the logical thread, the client needs to store the visual history (text + base64 images) to render the UI, as we cannot re-fetch the full visual history from the API easily without storing it.
-   **Persistence:**
    -   *Option A (MVP):* Ephemeral. Refreshing the page clears the chat.
    -   *Option B (Robust):* Store active conversation history in `IndexedDB` (via `Session_store` or similar) so it survives reloads.

#### Image Handling
1.  **Generation:**
    -   User sends prompt -> `Chat_panel` calls API.
    -   API returns Base64 image.
    -   Image is displayed in `Conversation_view`.
2.  **Promotion to Gallery:**
    -   User clicks "Add to Gallery".
    -   The Base64 data is converted to a Blob.
    -   `gallery.addThumbnail(blob, prompt, ...)` is called.
    -   The image is now part of the permanent collection and behaves like a regular generated image.

### 3.3 API Integration Strategy

Since we are not using the OpenAI Node.js SDK, we will implement a raw `fetch` wrapper for the `/v1/responses` endpoint.

**Endpoint:** `POST https://api.openai.com/v1/responses`

**Payload Structure:**
```json
{
  "model": "gpt-4o-mini", // or specific model
  "input": "User prompt...",
  "previous_response_id": "resp_...", // Omitted for the first message
  "tools": [
    {
      "type": "image_generation"
    }
  ]
}
```

**Response Handling:**
-   Parse the JSON response.
-   Extract `output` array.
-   Handle `message` items (text).
-   Handle `image_generation_call` items (extract `result` which is Base64).
-   Store the new `id` for the next request.

## 4. Feasibility Analysis

-   **Technical Feasibility:** **High**. The integration is straightforward. The "Responses API" maps well to a standard chat interface. We already have all the building blocks (image rendering, gallery management, API handling).
-   **UI/UX:** The "Two Tabs" approach is a clean way to introduce this feature without cluttering the main workflow. It clearly separates "Tool Mode" (Generate) from "Conversational Mode" (Chat).
-   **Performance:** Storing many Base64 images in the DOM or memory for the chat history could be heavy. We might need to offload older chat images to `IndexedDB` or limit the visible history if conversations get long.

## 5. Implementation Plan

1.  **API Layer:**
    -   Create `responses_api.js` service to handle the raw `fetch` calls to `/v1/responses`.
    -   Implement error handling and response parsing.

2.  **UI Skeleton:**
    -   Modify `index.html` to add the tab container.
    -   Implement basic tab switching logic in `app.js`.

3.  **Chat Component:**
    -   Build `Chat_panel` class.
    -   Implement `Chat_input` (text + drag & drop).
    -   Implement `Conversation_view` (rendering messages).

4.  **Integration:**
    -   Connect `Chat_panel` to `responses_api.js`.
    -   Implement the "Add to Gallery" callback in `Chat_panel` and connect it to the main `gallery` instance in `app.js`.

5.  **Refinement:**
    -   Style the chat bubbles and image containers.
    -   Add "New Conversation" button (resets `previous_response_id` and clears UI).

## 6. Thoughts & Recommendations

-   **Conversation Management:** The user mentioned relying on server-side mechanisms. The Responses API is designed to be stateless on the client regarding the *logic* (you just pass the ID), but the *content* (what was said/shown) is not automatically re-sent by the server. **Crucial Point:** If we want the user to see previous messages after a reload, *we* must save them. The API does not provide a "get history for conversation X" endpoint (it's not the Assistants API with Threads). It just continues the context.
    -   *Recommendation:* For V1, keep it ephemeral (clears on reload) or use `localStorage`/`IndexedDB` to cache the current conversation's display data.
-   **Model Selection:** The Responses API might require specific models (e.g., `gpt-4o`). We need to ensure the model selector in the UI (or a specific one for the Chat tab) allows selecting compatible models.
-   **"Tools":** Currently, we only care about `image_generation`. The architecture should be flexible enough to support other tools later (e.g., `edit_image` if the API supports it via tools in the future).

This plan provides a solid foundation for integrating the conversational capabilities while respecting the existing application structure.
