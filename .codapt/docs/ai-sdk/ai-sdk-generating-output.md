You can request a structured object from the LLM, by defining the structure using a Zod schema and using generateObject:

```
import { generateObject } from "ai";
import { z } from "zod";

const { object } = await generateObject({
  model: yourModel,
  schema: z.object({
    recipe: z.object({
      name: z.string(),
      ingredients: z.array(z.object({ name: z.string(), amount: z.string() })),
      steps: z.array(z.string()),
    }),
  }),
  prompt: "Generate a lasagna recipe.",
  // or
  messages: [
    {
      role: "user",
      content: "Generate a lasagna recipe.",
    },
  ],
});

// `object` is now an object with property `recipe`
```

If you want to generate an array of objects, you can set the output strategy to array. When you use the array output strategy, the schema specifies the shape of an array element. With streamObject, you can also stream the generated array elements using elementStream.

```
import { openai } from "@ai-sdk/openai";
import { streamObject } from "ai";
import { z } from "zod";

const { elementStream } = streamObject({
  model: openai("gpt-4-turbo"),
  output: "array",
  schema: z.object({
    name: z.string(),
    class: z
      .string()
      .describe("Character class, e.g. warrior, mage, or thief."),
    description: z.string(),
  }),
  prompt: "Generate 3 hero descriptions for a fantasy role playing game.",
});

for await (const hero of elementStream) {
  console.log(hero);
}
```

If you want to generate a specific enum value, e.g. for classification tasks, you can set the output strategy to enum and provide a list of possible values in the enum parameter.

```
import { generateObject } from "ai";

const { object } = await generateObject({
  model: yourModel,
  output: "enum",
  enum: ["action", "comedy", "drama", "horror", "sci-fi"],
  prompt:
    'Classify the genre of this movie plot: ' +
    '"A group of astronauts travel through a wormhole in search of a ' +
    'new habitable planet for humanity."',
});
```
