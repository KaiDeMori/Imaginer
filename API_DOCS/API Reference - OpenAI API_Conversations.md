# OpenAI API Reference: Conversations

Create and manage conversations to store and retrieve conversation state across Responses API calls.

Base URL: https://api.openai.com/v1


## Create a conversation
POST /conversations

Create a conversation.

Request body
- items (array, optional): Initial items to include in the conversation context. You may add up to 20 items at a time.
- metadata (object or null, optional): Set of up to 16 key-value pairs that can be attached to an object. Useful for storing additional information about the object in a structured format, and querying via API or dashboard.
  - Keys are strings with a maximum length of 64 characters.
  - Values are strings with a maximum length of 512 characters.

Returns
- A Conversation object.

Example request (JavaScript)
```javascript
import OpenAI from "openai";
const client = new OpenAI();
const conversation = await client.conversations.create({
  metadata: { topic: "demo" },
  items: [
    { type: "message", role: "user", content: "Hello!" }
  ],
});
console.log(conversation);
```


## Retrieve a conversation
GET /conversations/{conversation_id}

Get a conversation by ID.

Path parameters
- conversation_id (string, required): The ID of the conversation to retrieve.

Returns
- A Conversation object.

Example request (JavaScript)
```javascript
import OpenAI from "openai";
const client = new OpenAI();
const conversation = await client.conversations.retrieve("conv_123");
console.log(conversation);
```

Example response
```json
{
  "id": "conv_123",
  "object": "conversation",
  "created_at": 1741900000,
  "metadata": {"topic": "demo"}
}
```


## Update a conversation
POST /conversations/{conversation_id}

Update metadata for a conversation.

Path parameters
- conversation_id (string, required): The ID of the conversation to update.

Request body
- metadata (map, required): Set of key-value pairs to attach to the conversation.
  - Up to 16 pairs total.
  - Keys are strings with a maximum length of 64 characters.
  - Values are strings with a maximum length of 512 characters.

Returns
- The updated Conversation object.

Example request (JavaScript)
```javascript
import OpenAI from "openai";
const client = new OpenAI();
const updated = await client.conversations.update(
  "conv_123",
  { metadata: { topic: "project-x" } }
);
console.log(updated);
```

Example response
```json
{
  "id": "conv_123",
  "object": "conversation",
  "created_at": 1741900000,
  "metadata": {"topic": "project-x"}
}
```


## Delete a conversation
DELETE /conversations/{conversation_id}

Delete a conversation. Items in the conversation will not be deleted.

Path parameters
- conversation_id (string, required): The ID of the conversation to delete.

Returns
- A success message.

Example request (JavaScript)
```javascript
import OpenAI from "openai";
const client = new OpenAI();
const deleted = await client.conversations.delete("conv_123");
console.log(deleted);
```

Example response
```json
{
  "id": "conv_123",
  "object": "conversation.deleted",
  "deleted": true
}
```


## List items
GET /conversations/{conversation_id}/items

List all items for a conversation with the given ID.

Path parameters
- conversation_id (string, required): The ID of the conversation to list items for.

Query parameters
- after (string, optional): An item ID to list items after, used in pagination.
- include (array, optional): Specify additional output data to include in the response. Supported values:
  - web_search_call.action.sources: Include the sources of the web search tool call.
  - code_interpreter_call.outputs: Include the outputs of Python code execution in code interpreter tool call items.
  - computer_call_output.output.image_url: Include image URLs from the computer call output.
  - file_search_call.results: Include the search results of the file search tool call.
  - message.input_image.image_url: Include image URLs from the input message.
  - message.output_text.logprobs: Include logprobs with assistant messages.
  - reasoning.encrypted_content: Include an encrypted version of reasoning tokens in reasoning item outputs. This enables reasoning items to be used in multi-turn conversations when using the Responses API statelessly (e.g., when the store parameter is set to false, or when an organization is enrolled in the zero data retention program).
- limit (integer, optional, default 20): A limit on the number of objects to be returned. Range: 1–100.
- order (string, optional, default desc): The order to return the input items in.
  - asc: Return the input items in ascending order.
  - desc: Return the input items in descending order.

Returns
- A list object containing Conversation items.

Example request (JavaScript)
```javascript
import OpenAI from "openai";
const client = new OpenAI();
const items = await client.conversations.items.list("conv_123", { limit: 10 });
console.log(items.data);
```

Example response
```json
{
  "object": "list",
  "data": [
    {
      "type": "message",
      "id": "msg_abc",
      "status": "completed",
      "role": "user",
      "content": [
        {"type": "input_text", "text": "Hello!"}
      ]
    }
  ],
  "first_id": "msg_abc",
  "last_id": "msg_abc",
  "has_more": false
}
```


## Create items
POST /conversations/{conversation_id}/items

Create items in a conversation with the given ID.

Path parameters
- conversation_id (string, required): The ID of the conversation to add the item to.

Query parameters
- include (array, optional): Additional fields to include in the response. See the include parameter for listing conversation items for more details.

Request body
- items (array, required): The items to add to the conversation. You may add up to 20 items at a time.

Returns
- The list of added items.

Example request (JavaScript)
```javascript
import OpenAI from "openai";
const client = new OpenAI();
const items = await client.conversations.items.create(
  "conv_123",
  {
    items: [
      {
        type: "message",
        role: "user",
        content: [{ type: "input_text", text: "Hello!" }],
      },
      {
        type: "message",
        role: "user",
        content: [{ type: "input_text", text: "How are you?" }],
      },
    ],
  }
);
console.log(items.data);
```

Example response
```json
{
  "object": "list",
  "data": [
    {
      "type": "message",
      "id": "msg_abc",
      "status": "completed",
      "role": "user",
      "content": [
        {"type": "input_text", "text": "Hello!"}
      ]
    },
    {
      "type": "message",
      "id": "msg_def",
      "status": "completed",
      "role": "user",
      "content": [
        {"type": "input_text", "text": "How are you?"}
      ]
    }
  ],
  "first_id": "msg_abc",
  "last_id": "msg_def",
  "has_more": false
}
```


## Retrieve an item
GET /conversations/{conversation_id}/items/{item_id}

Get a single item from a conversation with the given IDs.

Path parameters
- conversation_id (string, required): The ID of the conversation that contains the item.
- item_id (string, required): The ID of the item to retrieve.

Query parameters
- include (array, optional): Additional fields to include in the response. See the include parameter for listing conversation items for more details.

Returns
- A Conversation Item.

Example request (JavaScript)
```javascript
import OpenAI from "openai";
const client = new OpenAI();
const item = await client.conversations.items.retrieve(
  "conv_123",
  "msg_abc"
);
console.log(item);
```

Example response
```json
{
  "type": "message",
  "id": "msg_abc",
  "status": "completed",
  "role": "user",
  "content": [
    {"type": "input_text", "text": "Hello!"}
  ]
}
```


## Delete an item
DELETE /conversations/{conversation_id}/items/{item_id}

Delete an item from a conversation with the given IDs.

Path parameters
- conversation_id (string, required): The ID of the conversation that contains the item.
- item_id (string, required): The ID of the item to delete.

Returns
- The updated Conversation object.

Example request (JavaScript)
```javascript
import OpenAI from "openai";
const client = new OpenAI();
const conversation = await client.conversations.items.delete(
  "conv_123",
  "msg_abc"
);
console.log(conversation);
```

Example response
```json
{
  "id": "conv_123",
  "object": "conversation",
  "created_at": 1741900000,
  "metadata": {"topic": "demo"}
}
```


## Schema

### Conversation object
- created_at (integer): The time at which the conversation was created, measured in seconds since the Unix epoch.
- id (string): The unique ID of the conversation.
- metadata (object): Set of up to 16 key-value pairs that can be attached to an object. Keys are strings with a maximum length of 64 characters. Values are strings with a maximum length of 512 characters.
- object (string): The object type, always "conversation".

### Item list object
- data (array): A list of conversation items.
- first_id (string): The ID of the first item in the list.
- has_more (boolean): Whether there are more items available.
- last_id (string): The ID of the last item in the list.
- object (string): The type of object returned; must be "list".
