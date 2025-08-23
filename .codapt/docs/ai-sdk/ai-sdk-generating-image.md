The AI SDK provides the generateImage function to generate images based on a given prompt using an image model.

You should use `openai.image("gpt-image-1")` or `openai.image("dall-e-3")` to generate images, unless otherwise specified.

IMPORTANT: You must import `experimental_generateImage`, NOT JUST `generateImage`.

```
import { experimental_generateImage as generateImage } from 'ai';
import { openai } from '@ai-sdk/openai';

const { image } = await generateImage({
  model: openai.image('gpt-image-1'),
  prompt: 'Santa Claus driving a Cadillac',
});

// You can access the image data using the base64 or uint8Array properties:
const base64 = image.base64; // base64 image data
const uint8Array = image.uint8Array; // Uint8Array image data
```

We can set the size:

```
const { image } = await generateImage({
  model: openai.image('gpt-image-1'),
  prompt: 'Santa Claus driving a Cadillac',
  size: '1024x1024',
});
```

Or aspect ratio:

```
const { image } = await generateImage({
  model: vertex.image('imagen-3.0-generate-002'),
  prompt: 'Santa Claus driving a Cadillac',
  aspectRatio: '16:9',
});
```
