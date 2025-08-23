You can generate text using the generateText function. This function is ideal for non-interactive use cases where you need to write text (e.g. drafting email or summarizing web pages) and for agents that use tools.

Consider generating structured objects instead!

```
import { generateText } from "ai";

const { text } = await generateText({
  model: yourModel,
  prompt: "Write a vegetarian lasagna recipe for 4 people.", // alternatively you can pass an array of `messages` with { role: ..., content: ... }
});
```

You can use more advanced prompts to generate text with more complex instructions and content:

```
import { generateText } from "ai";

const { text } = await generateText({
  model: yourModel,
  system:
    "You are a professional writer. " +
    "You write simple, clear, and concise content.",
  prompt: `Summarize the following article in 3-5 sentences: ${article}`,
});
```

The result object of generateText contains several promises that resolve when all required data is available:

`result.text`: The generated text.
`result.finishReason`: The reason the model finished generating text.
`result.usage`: The usage of the model during text generation.
`result.reasoning`: The reasoning text of the model (only available for some models).

To get the model object, do something like:

```
import { openai } from "@ai-sdk/openai";
const model = openai("gpt-4o-mini");
```

You can use this model as a parameter to generateText.
