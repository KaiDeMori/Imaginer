# Images — OpenAI API Reference

Given a prompt and/or an input image, the Images API can generate a new image, edit an existing image, or create variations.

- Related guide: Image generation

---

## Create image

POST https://api.openai.com/v1/images/generations

Creates an image given a text prompt.

### Request body

- prompt (string, required)
  - A text description of the desired image(s).
  - Maximum length: 32,000 characters for GPT image models, 1,000 for dall-e-2, and 4,000 for dall-e-3.

- background (string or null, optional, default: "auto")
  - Controls background transparency for GPT image models. One of: `transparent`, `opaque`, `auto` (default). 
  - If `transparent`, the output format must support transparency (use `png` or `webp`).

- model (string, optional, default: "dall-e-2")
  - One of: `dall-e-2`, `dall-e-3`, or a GPT image model (`gpt-image-1`, `gpt-image-1-mini`, `gpt-image-1.5`).
  - Defaults to `dall-e-2` unless a parameter specific to GPT image models is used.

- moderation (string or null, optional, default: "auto")
  - For GPT image models only. Controls content-moderation level: `low` or `auto` (default).

- n (integer or null, optional, default: 1)
  - Number of images to generate. Range: 1–10. For `dall-e-3`, only `n = 1` is supported.

- output_compression (integer or null, optional, default: 100)
  - For GPT image models when `output_format` is `webp` or `jpeg`. Compression level: 0–100%.

- output_format (string or null, optional, default: "png")
  - For GPT image models only. One of: `png`, `jpeg`, `webp`.

- partial_images (integer, optional, default: 0)
  - For GPT image model streaming responses that return partial images. Range: 0–3. If 0, the response is a single image in one streaming event. The final image may arrive before all partials complete.

- quality (string or null, optional, default: "auto")
  - `auto` selects the best quality for the model.
  - GPT image models: `high`, `medium`, `low`.
  - dall-e-3: `hd`, `standard`.
  - dall-e-2: `standard` only.

- response_format (string or null, optional, default: "url")
  - For `dall-e-2` and `dall-e-3` only: `url` or `b64_json`. URLs are valid for 60 minutes.
  - GPT image models always return base64-encoded images.

- size (string or null, optional, default: "auto")
  - GPT image models: `1024x1024`, `1536x1024` (landscape), `1024x1536` (portrait), or `auto` (default).
  - dall-e-2: `256x256`, `512x512`, `1024x1024`.
  - dall-e-3: `1024x1024`, `1792x1024`, `1024x1792`.

- stream (boolean or null, optional, default: false)
  - For GPT image models, enables streaming.

- style (string or null, optional, default: "vivid")
  - For `dall-e-3` only. One of: `vivid`, `natural`.

- user (string, optional)
  - A unique identifier for the end user to help with abuse monitoring.

### Returns

- Returns an image object.

### Example request (curl)

```bash
curl https://api.openai.com/v1/images/generations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d '{
    "model": "gpt-image-1.5",
    "prompt": "A cute baby sea otter",
    "n": 1,
    "size": "1024x1024"
  }'
```

### Example response

```json
{
  "created": 1713833628,
  "data": [
    {
      "b64_json": "..."
    }
  ],
  "usage": {
    "total_tokens": 100,
    "input_tokens": 50,
    "output_tokens": 50,
    "input_tokens_details": {
      "text_tokens": 10,
      "image_tokens": 40
    }
  }
}
```

---

## Create image edit

POST https://api.openai.com/v1/images/edits

Creates an edited or extended image given one or more source images and a prompt. Supports GPT image models and `dall-e-2`.

### Request body

- image (string or array, required)
  - The image(s) to edit. Must be a supported image file or an array of images.
  - GPT image models (`gpt-image-1`, `gpt-image-1-mini`, `gpt-image-1.5`): each image should be `png`, `webp`, or `jpg`, less than 50MB. Up to 16 images.
  - `dall-e-2`: one image only; must be a square `png`, less than 4MB.

- prompt (string, required)
  - A text description of the desired edit.
  - Maximum length: 1,000 characters for `dall-e-2`, 32,000 for GPT image models.

- background (string or null, optional, default: "auto")
  - For GPT image models: `transparent`, `opaque`, or `auto` (default). If `transparent`, use `png` or `webp` output.

- input_fidelity (string, optional)
  - For `gpt-image-1` only; unsupported for `gpt-image-1-mini`.
  - Controls how closely the model matches input style and features (especially faces). One of: `high`, `low` (default: `low`).

- mask (file, optional)
  - An additional image where fully transparent regions (alpha = 0) indicate the areas to edit. Applied to the first input image if multiple images are provided. Must be PNG, <4MB, same dimensions as the main image.

- model (string, optional, default: "dall-e-2")
  - Only `dall-e-2` and the GPT image models are supported.

- n (integer or null, optional, default: 1)
  - Number of images to generate. Range: 1–10.

- output_compression (integer or null, optional, default: 100)
  - For GPT image models with `webp` or `jpeg` output formats. 0–100%.

- output_format (string or null, optional, default: "png")
  - For GPT image models: `png`, `jpeg`, or `webp`.

- partial_images (integer, optional, default: 0)
  - For GPT image model streaming responses that return partial images. Range: 0–3.

- quality (string or null, optional, default: "auto")
  - GPT image models: `high`, `medium`, `low`.
  - `dall-e-2`: `standard` only.

- response_format (string or null, optional, default: "url")
  - For `dall-e-2` only. One of: `url`, `b64_json`.

- size (string or null, optional, default: "1024x1024")
  - GPT image models: `1024x1024`, `1536x1024` (landscape), `1024x1536` (portrait).
  - `dall-e-2`: `256x256`, `512x512`, `1024x1024`.

- stream (boolean or null, optional, default: false)
  - Edit in streaming mode (GPT image models).

- user (string, optional)
  - A unique end-user ID to help with abuse monitoring.

### Returns

- Returns an image object.

### Example request (curl, multipart form)

```bash
curl -X POST "https://api.openai.com/v1/images/edits" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -F "model=gpt-image-1.5" \
  -F "image[]=@body-lotion.png" \
  -F "image[]=@bath-bomb.png" \
  -F "image[]=@incense-kit.png" \
  -F "image[]=@soap.png" \
  -F 'prompt=Create a lovely gift basket with these four items in it'
```

### Example request (curl, decode base64 to file)

```bash
curl -s -D >(grep -i x-request-id >&2) \
  -o >(jq -r '.data[0].b64_json' | base64 --decode > gift-basket.png) \
  -X POST "https://api.openai.com/v1/images/edits" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -F "model=gpt-image-1.5" \
  -F "image[]=@body-lotion.png" \
  -F "image[]=@bath-bomb.png" \
  -F "image[]=@incense-kit.png" \
  -F "image[]=@soap.png" \
  -F 'prompt=Create a lovely gift basket with these four items in it'
```

---

## Create image variation

POST https://api.openai.com/v1/images/variations

Creates a variation of a given image. This endpoint supports `dall-e-2`.

### Request body

- image (file, required)
  - The base image for the variation. Must be a square PNG, <4MB.

- model (string or "dall-e-2", optional, default: "dall-e-2")
  - Only `dall-e-2` is supported.

- n (integer or null, optional, default: 1)
  - Number of images to generate. Range: 1–10.

- response_format (string or null, optional, default: "url")
  - `url` or `b64_json`. URLs are valid for 60 minutes after generation.

- size (string or null, optional, default: "1024x1024")
  - One of: `256x256`, `512x512`, `1024x1024`.

- user (string, optional)
  - A unique identifier for the end user.

### Returns

- Returns a list of image objects.

### Example request (curl)

```bash
curl https://api.openai.com/v1/images/variations \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -F image="@otter.png" \
  -F n=2 \
  -F size="1024x1024"
```

### Example response

```json
{
  "created": 1589478378,
  "data": [
    { "url": "https://..." },
    { "url": "https://..." }
  ]
}
```

---

## Image generation response object

Describes the response returned from image generation endpoints.

- background (string)
  - The background setting used for generation. Either `transparent` or `opaque`.

- created (integer)
  - Unix timestamp (seconds) when the image was created.

- data (array)
  - List of generated images.
  - For GPT image models: items include `b64_json` content.
  - For `dall-e-2`/`dall-e-3`: items include `url` or `b64_json` depending on `response_format`.

- output_format (string)
  - The output format: `png`, `webp`, or `jpeg`.

- quality (string)
  - The quality used: `low`, `medium`, `high` (GPT image models), or `standard`/`hd` as applicable.

- size (string)
  - The size of the generated image, for example `1024x1024`, `1024x1536`, or `1536x1024`.

- usage (object)
  - For GPT image models (e.g., `gpt-image-1`), token usage details for the generation request:
    - total_tokens (integer)
    - input_tokens (integer)
    - output_tokens (integer)
    - input_tokens_details (object)
      - text_tokens (integer)
      - image_tokens (integer)

### Example

```json
{
  "created": 1713833628,
  "data": [
    {
      "b64_json": "..."
    }
  ],
  "background": "transparent",
  "output_format": "png",
  "size": "1024x1024",
  "quality": "high",
  "usage": {
    "total_tokens": 100,
    "input_tokens": 50,
    "output_tokens": 50,
    "input_tokens_details": {
      "text_tokens": 10,
      "image_tokens": 40
    }
  }
}
```
