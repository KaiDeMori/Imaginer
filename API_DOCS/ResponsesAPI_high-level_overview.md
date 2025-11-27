# Responses API: High-Level Overview

The Responses API is a unified, agentic interface that evolves beyond simple request/response patterns. It is designed for multi-turn interactions, tool use, and maintaining state.

## Key Differences vs. Image API

If you are migrating from the Image API, the fundamental shift is from **direct endpoint calls** to **conversational tool use**.

| Feature | Image API | Responses API |
| :--- | :--- | :--- |
| **Paradigm** | **Direct**: You call an endpoint (`generations`, `edits`) with a prompt. | **Agentic**: You send a conversation turn. The model *decides* to call the `image_generation` tool based on your input. |
| **Workflow** | Single-shot. "Fire and forget". | Multi-turn / Iterative. You can refine images conversationally. |
| **Models** | `dall-e-2`, `dall-e-3`, `gpt-image-1`. | Currently supports `gpt-image-1` via the built-in tool. |
| **Inputs** | Raw bytes or prompts. | Accepts text, image inputs, and **File IDs** (allows referencing uploaded files for editing). |
| **State** | Stateless. | Stateful (via Conversations). Context is preserved for iterative editing. |

## Core Concepts

1.  **Unified Interface**: Handles text, images, and tool execution in a single loop.
2.  **Items vs. Messages**: Instead of a monolithic "Message" object, the API uses distinct "Items" (e.g., `message`, `function_call`, `function_call_output`).
3.  **State Management**:
    *   **Conversations**: Server-side storage of interaction history.
    *   **Storage**: Responses are stored by default (`store: true`).

## Important Properties

### Creating a Response (`POST /responses`)

*   **`model`**: The driving logic model (e.g., `gpt-4o`, `gpt-5`). *Note: This is the chat model that calls the image tool, not the image model itself.*
*   **`tools`**: The capabilities available to the model.
    *   *Required for images:* `[{ type: "image_generation" }]`
*   **`input`**: The user's prompt or data. Can be a string or an array of text/image items.
*   **`conversation`** (or `conversation_id`): Links the response to a specific history container.
*   **`previous_response_id`**: Alternative to `conversation` for chaining responses.
*   **`instructions`**: System-level developer guidance. Unlike Chat Completions, these can be swapped per-turn without losing context.
*   **`store`**: `boolean` (Default: `true`). Whether to persist the interaction.

### Conversation Resource

*   **`items`**: The chronological list of interactions (inputs, outputs, tool calls) within a conversation.

## Image generation & edit

*   **Model**: Exclusively uses `gpt-image-1` via the `image_generation` tool.

### Inputs & Outputs
*   **Input Flexibility**: Accepts text, raw image bytes, and **File IDs** (uploaded files).
*   **Contextual Awareness**: Can "see" images previously generated or uploaded in the conversation history to perform operations on them.
*   **Output**: Returns image data which can be referenced in subsequent turns.

### Editing & Masks
*   **Conversational Editing**: Unlike the Image API's stateless "edit" endpoint, editing here is **iterative and conversational**. You ask the model to change specific aspects of an image it just generated or was provided.
*   **Masks**: The documentation associates explicit mask uploads (inpainting) primarily with DALL-E 2. `gpt-image-1` in the Responses API focuses on **semantic editing** via natural language instructions (e.g., "change the background to blue") rather than manual mask uploads.

### Customization & Properties
*   **Output Options**: Supports standard customization for quality, size, format, and compression.
*   **Transparency**: Can enable transparent backgrounds.
*   **Streaming**: Supports `partial_images` to stream generation progress (incurs additional token costs).
