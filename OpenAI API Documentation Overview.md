# OpenAI API Documentation Overview

This document provides a curated overview of the OpenAI API docs with a focus on the **Responses API** and **Image generation**. It links directly to key topics and includes short descriptions to help you quickly find the right reference.

---

## Responses API (Recommended Unified API)

The **Responses API** is OpenAI’s modern, unified API for building agentic applications. It replaces Chat Completions and supports multimodal inputs (text + images), tool calls, multi-turn conversations, and built-in tools.

### Key Concepts

- **Items vs Messages** — Responses returns a typed `output` array of items (e.g., `message`, `image_generation_call`, `tool_call`) instead of Chat Completions’ `choices`/`messages`.
- **Statefulness** — Responses can store context automatically and supports `previous_response_id` for multi-turn flows.
- **Native tools** — Built-in tools like web search, file search, code interpreter, image generation, etc. can be invoked directly during a single API request.

### Core Documentation Links

- **Responses API Guide (migration + overview)**
  - https://developers.openai.com/api/docs/guides/migrate-to-responses
  - Covers: why use Responses, how it differs from Chat Completions, multi-turn state, tool calls, and migration steps.

- **Responses API Reference (create endpoint)**
  - https://developers.openai.com/api/docs/api-reference/responses/create
  - Includes: request schema, `input`, `tools`, `previous_response_id`, `store`, `include`, and response format.

- **Conversation state (multi-turn context)**
  - https://developers.openai.com/api/docs/guides/conversation-state?api-mode=responses#using-the-conversations-api
  - Explains `previous_response_id`, stored responses, and how to manage conversation state.

- **Server-side statefulness (Conversations API)**
  - https://developers.openai.com/api/docs/api-reference/conversations/create
  - Shows how to create a durable conversation object, persist state across sessions, and use `conversation` or `previous_response_id` for threaded flows.
  - Includes patterns for stateless operation using `store: false` and encrypted reasoning (`include: ["reasoning.encrypted_content"]`).

- **Streaming responses**
  - https://developers.openai.com/api/docs/guides/streaming-responses
  - Includes examples for streaming partial output and how to consume events.

- **Tools (native tool ecosystem)**
  - https://developers.openai.com/api/docs/guides/tools?api-mode=responses
  - Contains overview of built-in tools, including the image generation tool.

---

## Image Generation (Focus)

OpenAI offers two primary ways to generate images:

1. **Image API** – Direct image creation/editing endpoints.
2. **Responses API (image generation tool)** – Integrate image generation into a multi-turn, agent-style flow with other tool calls.

### Image API (Standalone)

- **Image API Reference (create / edit / variations)**
  - https://developers.openai.com/api/docs/api-reference/images
  - Endpoints: `POST /v1/images`, `POST /v1/images/edits`, `POST /v1/images/variations`.

- **Image generation guide**
  - https://developers.openai.com/api/docs/guides/image-generation
  - Covers: prompt-based generation, edits (inpainting), variations, output customization (size, quality, format, transparency), streaming, and cost.

### Responses API (Image Generation Tool)

- **Image generation tool overview (Responses)**
  - https://developers.openai.com/api/docs/guides/image-generation (same guide, but includes Responses tool details)
  - Highlight: use the `tools` field with `{"type": "image_generation"}` to generate or edit images as part of a conversation.

- **Image generation tool reference (Responses API)**
  - https://developers.openai.com/api/docs/guides/tools?api-mode=responses#image-generation
  - Covers: tool configuration options (`action`, `quality`, `size`, `background`, `partial_images`, `input_fidelity`, `input_image_mask`) and response output structure.

### Key image generation features (Responses)

- **Multi-turn editing**: Use `previous_response_id` to iterate on images across turns.
- **Generate vs edit**: `action` can be `auto` (default), `generate`, or `edit`.
- **Streaming partial images**: `partial_images` streams intermediate image previews as they generate.
- **High input fidelity**: Preserve input image details by setting `input_fidelity` to `high`.
- **Mask-based inpainting**: Supply a mask image via `input_image_mask` to guide edits.

---

## Quick Links (Focused)

- Responses API: https://developers.openai.com/api/docs/api-reference/responses
- Image API: https://developers.openai.com/api/docs/api-reference/images
- Image generation guide: https://developers.openai.com/api/docs/guides/image-generation
- Responses API guide: https://developers.openai.com/api/docs/guides/migrate-to-responses
- Tools guide (Responses): https://developers.openai.com/api/docs/guides/tools?api-mode=responses
- Conversation state (Responses): https://developers.openai.com/api/docs/guides/conversation-state?api-mode=responses
- Streaming responses: https://developers.openai.com/api/docs/guides/streaming-responses

