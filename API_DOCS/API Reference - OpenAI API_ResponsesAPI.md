# OpenAI Responses API — API Reference

OpenAI's most advanced interface for generating model responses. Supports text and image inputs, and text outputs. Create stateful interactions with the model, using the output of previous responses as input. Extend the model's capabilities with built-in tools for file search, web search, computer use, and more. Allow the model access to external systems and data using function calling.

Related guides:
- Quickstart
- Text inputs and outputs
- Image inputs
- Structured Outputs
- Function calling
- Conversation state
- Extend the models with tools

Base URL: https://api.openai.com/v1

Authentication: Use the Authorization: Bearer <API_KEY> header.


## Create a model response

POST /responses

Creates a model response. Provide text or image inputs to generate text or JSON outputs. Have the model call your own custom code or use built-in tools like web search or file search to use your own data as input for the model's response.

Request body parameters
- background (boolean, optional, default: false)
  - Whether to run the model response in the background.
- conversation (string or object, optional, default: null)
  - The conversation that this response belongs to. Items from this conversation are prepended to input_items for this response request. Input items and output items from this response are automatically added to this conversation after this response completes.
- include (array, optional)
  - Specify additional output data to include in the model response. Supported values:
    - web_search_call.action.sources — Include the sources of the web search tool call.
    - code_interpreter_call.outputs — Include outputs of Python code execution in code interpreter tool call items.
    - computer_call_output.output.image_url — Include image URLs from the computer call output.
    - file_search_call.results — Include search results of the file search tool call.
    - message.input_image.image_url — Include image URLs from the input message.
    - message.output_text.logprobs — Include logprobs with assistant messages.
    - reasoning.encrypted_content — Includes an encrypted version of reasoning tokens in reasoning item outputs (for stateless usage or zero data retention scenarios).
- input (string or array, optional)
  - Text, image, or file inputs to the model, used to generate a response.
- instructions (string, optional)
  - A system (developer) message inserted into the model's context. When used with previous_response_id, the prior instructions are not carried over, enabling you to swap system messages between responses.
- max_output_tokens (integer, optional)
  - Upper bound for tokens that can be generated for a response, including visible output tokens and reasoning tokens.
- max_tool_calls (integer, optional)
  - Maximum total calls to built-in tools that can be processed in a response. Applies across all built-in tools.
- metadata (map, optional)
  - Up to 16 key-value pairs for storing additional info. Keys up to 64 chars; values up to 512 chars.
- model (string, optional)
  - Model ID used to generate the response (e.g., gpt-4o, o3). See model guide for options.
- parallel_tool_calls (boolean, optional, default: true)
  - Whether to allow the model to run tool calls in parallel.
- previous_response_id (string, optional)
  - Unique ID of the previous response for multi-turn conversations. Cannot be used with conversation.
- prompt (object, optional)
  - Reference to a prompt template and its variables.
- prompt_cache_key (string, optional)
  - Used by OpenAI to cache responses to optimize cache hit rates. Replaces user.
- prompt_cache_retention (string, optional)
  - Retention policy for the prompt cache. Set to "24h" to enable extended prompt caching (up to 24 hours).
- reasoning (object, optional; gpt-5 and o-series only)
  - Configuration options for reasoning models.
- safety_identifier (string, optional)
  - Stable identifier for end-users to help detect policy violations. Prefer hashing user identifiers.
- service_tier (string, optional, default: auto)
  - Specifies processing type used for serving the request. If set, the response includes service_tier actually used. Values:
    - auto — Uses project-configured service tier (default is "default" unless changed in Project settings).
    - default — Standard pricing and performance.
    - flex — Flexible tier (if available) with corresponding pricing/perf.
    - priority — Priority tier (if available) with corresponding pricing/perf.
- store (boolean, optional, default: true)
  - Whether to store the generated model response for later retrieval.
- stream (boolean, optional, default: false)
  - Stream model response data using server-sent events.
- stream_options (object, optional, default: null)
  - Options for streaming responses. Only set when stream: true.
- temperature (number, optional, default: 1)
  - Sampling temperature in [0, 2]. Higher values produce more random outputs. Adjust this or top_p but not both.
- text (object, optional)
  - Configuration options for a text response. Can be plain text or structured JSON. See Text inputs and outputs, Structured Outputs.
- tool_choice (string or object, optional)
  - How the model should select which tool(s) to use. Works with tools parameter.
- tools (array, optional)
  - An array of tools the model may call. Tool categories:
    - Built-in tools — provided by OpenAI (e.g., web search, file search).
    - MCP Tools — integrations via MCP servers/connectors (e.g., Google Drive, SharePoint).
    - Function calls (custom tools) — your own typed functions for the model to call.
- top_logprobs (integer, optional)
  - 0–20; number of most likely tokens to return at each token position with log probabilities.
- top_p (number, optional, default: 1)
  - Nucleus sampling; considers tokens with cumulative probability top_p. Adjust this or temperature, not both.
- truncation (string, optional, default: disabled)
  - Truncation strategy:
    - auto — If the input exceeds the model context window, the response is truncated to fit by dropping earliest conversation items.
    - disabled — If input size will exceed context window, request fails with 400.
- user (string, deprecated, optional)
  - Replaced by safety_identifier and prompt_cache_key.

Returns
- A Response object.

Example request (JavaScript)
```javascript
import OpenAI from "openai";
const openai = new OpenAI();

const response = await openai.responses.create({
  model: "gpt-4.1",
  input: "Tell me a three sentence bedtime story about a unicorn."
});

console.log(response);
```

Example response (JSON; abbreviated)
```json
{
  "id": "resp_67ccd2bed1ec8190b14f964abc0542670bb6a6b452d3795b",
  "object": "response",
  "created_at": 1741476542,
  "status": "completed",
  "error": null,
  "instructions": null,
  "max_output_tokens": null,
  "model": "gpt-4.1-2025-04-14",
  "output": [
    {
      "type": "message",
      "id": "msg_67ccd2bf17f0819081ff3bb2cf6508e60bb6a6b452d3795b",
      "status": "completed",
      "role": "assistant",
      "content": [
        {
          "type": "output_text",
          "text": "In a peaceful grove beneath a silver moon, ...",
          "annotations": []
        }
      ]
    }
  ],
  "parallel_tool_calls": true,
  "previous_response_id": null,
  "store": true,
  "temperature": 1.0,
  "text": { "format": { "type": "text" } },
  "tool_choice": "auto",
  "tools": [],
  "top_p": 1.0,
  "truncation": "disabled",
  "usage": {
    "input_tokens": 36,
    "input_tokens_details": { "cached_tokens": 0 },
    "output_tokens": 87,
    "output_tokens_details": { "reasoning_tokens": 0 },
    "total_tokens": 123
  },
  "metadata": {}
}
```


## Retrieve a model response

GET /responses/{response_id}

Retrieves a model response with the given ID.

Path parameters
- response_id (string, required)
  - The ID of the response to retrieve.

Query parameters
- include (array, optional)
  - Additional fields to include; same values as include for creation.
- include_obfuscation (boolean, optional)
  - Enables stream obfuscation when streaming, adding random characters to an obfuscation field to normalize payload sizes (mitigates certain side-channel attacks). Disable to optimize bandwidth if your network links are trusted.
- starting_after (integer, optional)
  - Sequence number of the event after which to start streaming.
- stream (boolean, optional)
  - If true, stream the response using SSE.

Returns
- The Response object matching the specified ID.

Example request (JavaScript)
```javascript
import OpenAI from "openai";
const client = new OpenAI();
const response = await client.responses.retrieve("resp_123");
console.log(response);
```

Example response (JSON; abbreviated)
```json
{
  "id": "resp_67cb71b351908190a308f3859487620d06981a8637e6bc44",
  "object": "response",
  "created_at": 1741386163,
  "status": "completed",
  "model": "gpt-4o-2024-08-06",
  "output": [
    {
      "type": "message",
      "id": "msg_67cb71b3c2b0819084d481baaaf148f206981a8637e6bc44",
      "status": "completed",
      "role": "assistant",
      "content": [
        {
          "type": "output_text",
          "text": "Silent circuits hum,\nThoughts emerge in data streams—\nDigital dawn breaks.",
          "annotations": []
        }
      ]
    }
  ],
  "parallel_tool_calls": true,
  "store": true,
  "temperature": 1.0,
  "text": { "format": { "type": "text" } },
  "tool_choice": "auto",
  "tools": [],
  "top_p": 1.0,
  "truncation": "disabled",
  "usage": {
    "input_tokens": 32,
    "input_tokens_details": { "cached_tokens": 0 },
    "output_tokens": 18,
    "output_tokens_details": { "reasoning_tokens": 0 },
    "total_tokens": 50
  },
  "metadata": {}
}
```


## Delete a model response

DELETE /responses/{response_id}

Deletes a model response with the given ID.

Path parameters
- response_id (string, required)

Returns
- A success message.

Example request (JavaScript)
```javascript
import OpenAI from "openai";
const client = new OpenAI();
const response = await client.responses.delete("resp_123");
console.log(response);
```

Example response
```json
{
  "id": "resp_6786a1bec27481909a17d673315b29f6",
  "object": "response",
  "deleted": true
}
```


## Cancel a response

POST /responses/{response_id}/cancel

Cancels a model response with the given ID. Only responses created with the background parameter set to true can be cancelled.

Path parameters
- response_id (string, required)

Returns
- A Response object.

Example request (JavaScript)
```javascript
import OpenAI from "openai";
const client = new OpenAI();
const response = await client.responses.cancel("resp_123");
console.log(response);
```


## List input items

GET /responses/{response_id}/input_items

Returns a list of input items for a given response.

Path parameters
- response_id (string, required)
  - The ID of the response to retrieve input items for.

Query parameters
- after (string, optional)
  - Item ID to list items after (pagination).
- include (array, optional)
  - Additional fields to include; same values as include for creation.
- limit (integer, optional, default: 20)
  - Number of objects to return (1–100).
- order (string, optional, default: desc)
  - asc — ascending order.
  - desc — descending order.

Returns
- A list of input item objects.

Example request (JavaScript)
```javascript
import OpenAI from "openai";
const client = new OpenAI();
const response = await client.responses.inputItems.list("resp_123");
console.log(response.data);
```

Example response
```json
{
  "object": "list",
  "data": [
    {
      "id": "msg_abc123",
      "type": "message",
      "role": "user",
      "content": [
        { "type": "input_text", "text": "Tell me a three sentence bedtime story about a unicorn." }
      ]
    }
  ],
  "first_id": "msg_abc123",
  "last_id": "msg_abc123",
  "has_more": false
}
```


## Get input token counts

POST /responses/input_tokens

Returns the input token count for the provided prospective request, without generating a response.

Request body (subset aligns with create fields)
- conversation (string or object, optional)
- input (string or array, optional)
- instructions (string, optional)
- model (string, optional)
- parallel_tool_calls (boolean, optional)
- previous_response_id (string, optional)
- reasoning (object, optional)
- text (object, optional)
- tool_choice (string or object, optional)
- tools (array, optional)
- truncation (string, optional)

Returns
```json
{
  "object": "response.input_tokens",
  "input_tokens": 123
}
```

Example request (cURL)
```bash
curl -X POST https://api.openai.com/v1/responses/input_tokens \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d '{
    "model": "gpt-5",
    "input": "Tell me a joke."
  }'
```

Example response
```json
{ "object": "response.input_tokens", "input_tokens": 11 }
```


## The Response object

Object: response

Fields
- background (boolean)
  - Whether the response was run in the background.
- conversation (object)
  - The conversation this response belongs to. Input and output items are automatically added.
- created_at (number)
  - Unix timestamp (seconds) when created.
- error (object)
  - Error details if the model failed to generate a response.
- id (string)
  - Unique identifier for the response.
- incomplete_details (object)
  - Details about why a response is incomplete.
- instructions (string or array)
  - System/developer instructions applied to this response.
- max_output_tokens (integer)
- max_tool_calls (integer)
- metadata (map)
  - Up to 16 key-value pairs.
- model (string)
- object (string)
  - Always "response".
- output (array)
  - Array of content items generated by the model. The length and order vary by response.
- output_text (string; SDK-only)
  - Aggregated text from output_text items in output (JS/Python SDK convenience).
- parallel_tool_calls (boolean)
- previous_response_id (string)
- prompt (object)
- prompt_cache_key (string)
- prompt_cache_retention (string)
- reasoning (object) — gpt-5 and o-series only
- safety_identifier (string)
- service_tier (string)
  - Actual processing tier used for this response when service_tier was set on request.
- status (string)
  - One of: completed, failed, in_progress, cancelled, queued, or incomplete.
- temperature (number)
- text (object)
  - Configuration/options for text responses.
- tool_choice (string or object)
- tools (array)
  - Built-in, MCP, or custom function-call tools.
- top_logprobs (integer)
- top_p (number)
- truncation (string)
  - auto or disabled.
- usage (object)
  - Token usage details, including:
    - input_tokens (number)
    - input_tokens_details.cached_tokens (number)
    - output_tokens (number)
    - output_tokens_details.reasoning_tokens (number)
    - total_tokens (number)
- user (string; deprecated)
  - Replaced by safety_identifier and prompt_cache_key.

Example (abbreviated)
```json
{
  "id": "resp_67ccd3a9da748190baa7f1570fe91ac604becb25c45c1d41",
  "object": "response",
  "created_at": 1741476777,
  "status": "completed",
  "model": "gpt-4o-2024-08-06",
  "output": [
    {
      "type": "message",
      "id": "msg_67ccd3acc8d48190a77525dc6de64b4104becb25c45c1d41",
      "status": "completed",
      "role": "assistant",
      "content": [
        { "type": "output_text", "text": "The image depicts a scenic landscape ...", "annotations": [] }
      ]
    }
  ],
  "parallel_tool_calls": true,
  "store": true,
  "temperature": 1,
  "text": { "format": { "type": "text" } },
  "tool_choice": "auto",
  "tools": [],
  "top_p": 1,
  "truncation": "disabled",
  "usage": {
    "input_tokens": 328,
    "input_tokens_details": { "cached_tokens": 0 },
    "output_tokens": 52,
    "output_tokens_details": { "reasoning_tokens": 0 },
    "total_tokens": 380
  },
  "metadata": {}
}
```


## The input item list

Object: list

Fields
- object (string)
  - Always "list".
- data (array)
  - A list of items used to generate this response.
- first_id (string)
  - The ID of the first item in the list.
- last_id (string)
  - The ID of the last item in the list.
- has_more (boolean)
  - Whether there are more items available.

Example
```json
{
  "object": "list",
  "data": [
    {
      "id": "msg_abc123",
      "type": "message",
      "role": "user",
      "content": [
        { "type": "input_text", "text": "Tell me a three sentence bedtime story about a unicorn." }
      ]
    }
  ],
  "first_id": "msg_abc123",
  "last_id": "msg_abc123",
  "has_more": false
}
```
