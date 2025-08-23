You can pass image data along with text to the LLM using the generateText, generateObject, etc functions.

Here's an example:

```
const result = await generateText({
  model: openai("gpt-4o"),
  messages: [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: "some text",
        },
        {
          type: "image",
          image: imageDataBuffer,
        },
      ],
    },
  ],
});
```
