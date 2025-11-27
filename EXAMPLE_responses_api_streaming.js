import OpenAI from "openai";
import fs from "fs";
const openai = new OpenAI();

const stream = await openai.responses.create({
  model: "gpt-4.1",
  input: "Draw a gorgeous image of a river made of white owl feathers, snaking its way through a serene winter landscape",
  stream: true,
  tools: [{ type: "image_generation", partial_images: 2 }],
});

for await (const event of stream) {
  if (event.type === "response.image_generation_call.partial_image") {
    const idx = event.partial_image_index;
    const imageBase64 = event.partial_image_b64;
    const imageBuffer = Buffer.from(imageBase64, "base64");
    fs.writeFileSync(`river${idx}.png`, imageBuffer);
  }
}
