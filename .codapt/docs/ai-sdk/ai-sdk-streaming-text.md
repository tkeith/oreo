You can use the streamText function for interactive use cases such as chat bots and other real-time applications. You can also generate UI components with tools.

Consider generating multiple structured objects instead!

```
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";

const { textStream } = streamText({
  model: openai("gpt-4o"),
  prompt: "Invent a new holiday and describe its traditions.", // alternatively you can pass an array of `messages` with { role: ..., content: ... }
});

for await (const textPart of textStream) {
  process.stdout.write(textPart);
}
```

Note that LLMs often return markdown-formatted text. If they're emitting content for the user consider rendering markdown text output.
