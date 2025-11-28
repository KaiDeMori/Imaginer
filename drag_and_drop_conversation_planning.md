# Drag and Drop & File Upload Planning for Conversation Mode

## 1. Strategy: "Just-in-Time" Upload

To maintain a smooth user experience and avoid unnecessary API calls/costs, we will **not** upload images immediately when they are dropped. Instead, we will keep them in memory (as `File` objects) and only upload them when the user commits to the action by clicking "Send".

### Workflow
1.  **User Action**: User drops images into the existing drag-and-drop area.
2.  **System State**: `drop_area_manager` stores the `File` objects. UI shows thumbnails (generated locally).
3.  **User Action**: User types a prompt and clicks "Send".
4.  **Upload Phase**:
    *   The system iterates through all files in `drop_area_manager`.
    *   Each file is uploaded to OpenAI's Files API (`POST /v1/files`) with `purpose="vision"`.
    *   The system waits for all uploads to complete and collects the returned `file_id`s.
5.  **Response Request**:
    *   The system constructs the `POST /v1/responses` request.
    *   The `input` array includes a user message containing the text prompt and the image references (using `file_id`).
6.  **Cleanup**:
    *   Upon successful request dispatch, the drop area is cleared.

## 2. API Details

### A. File Upload
*   **Endpoint**: `POST https://api.openai.com/v1/files`
*   **Headers**: `Authorization: Bearer <KEY>`
*   **Body (FormData)**:
    *   `file`: The binary file data.
    *   `purpose`: `"vision"` (Crucial for use with Responses API/GPT-4o).

### B. Responses Request
*   **Endpoint**: `POST https://api.openai.com/v1/responses`
*   **Input Structure**:
    We will wrap the inputs in a `message` item to group the text and images together.
    ```json
    {
      "model": "gpt-4o",
      "tools": [{ "type": "image_generation" }],
      "input": [
        {
          "type": "message",
          "role": "user",
          "content": [
            { "type": "input_text", "text": "User prompt here..." },
            { "type": "input_image", "file_id": "file-abc123..." },
            { "type": "input_image", "file_id": "file-xyz789..." }
          ]
        }
      ]
    }
    ```

## 3. Implementation Plan

### A. New Helper: `api/file_uploader.js`
A simple module to handle the file upload logic.

```javascript
// api/file_uploader.js
export async function upload_file(file_object, api_key) {
    const form_data = new FormData();
    form_data.append("file", file_object);
    form_data.append("purpose", "vision");

    const response = await fetch("https://api.openai.com/v1/files", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${api_key}`
        },
        body: form_data
    });

    if (!response.ok) {
        throw new Error(`File upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.id; // Returns "file-..."
}
```

### B. Integration in `Conversation_panel`
In the `handle_send` method of the conversation panel:

```javascript
import drop_area_manager from "../drop_area_manager.js";
import { upload_file } from "../../api/file_uploader.js";
// ... other imports

async function handle_send() {
    const prompt_text = prompt_input.value;
    const images = drop_area_manager.get_images(); // Array of { image: File, ... }
    
    // 1. Upload Images
    const uploaded_file_ids = [];
    if (images.length > 0) {
        // Show some loading indicator...
        try {
            const upload_promises = images.map(img_entry => 
                upload_file(img_entry.image, get_api_key())
            );
            uploaded_file_ids.push(...await Promise.all(upload_promises));
        } catch (error) {
            console.error("Upload failed", error);
            // Show error to user
            return;
        }
    }

    // 2. Construct Content Array
    const content_items = [];
    
    // Add text
    if (prompt_text.trim()) {
        content_items.push({ type: "input_text", text: prompt_text });
    }

    // Add images
    uploaded_file_ids.forEach(file_id => {
        content_items.push({ type: "input_image", file_id: file_id });
    });

    // 3. Send to Responses API
    const payload = {
        model: "gpt-4o",
        tools: [{ type: "image_generation" }],
        input: [
            {
                type: "message",
                role: "user",
                content: content_items
            }
        ]
        // ... conversation_id logic ...
    };

    // ... execute fetch ...

    // 4. Cleanup
    drop_area_manager.clear(); // Need to implement clear() in manager if not exists
    prompt_input.value = "";
}
```

### C. Updates Needed
1.  **`drop_area_manager.js`**: Ensure there is a method to clear/reset the state (e.g., `clear_images()`).
2.  **`Conversation_panel`**: Implement the logic above.
3.  **UI Feedback**: Since uploading might take a few seconds, the "Send" button should show a spinner or "Uploading..." state.
