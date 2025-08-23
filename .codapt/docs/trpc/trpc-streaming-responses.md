You can create a procedure that streams multiple values with:

```
const someStream = baseProcedure.query(async function* () {
  for (let i = 0; i < 3; i++) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    yield {
      // any kind of json-compatible object
      value: i,
      squaredValue: i * i,
      isGreaterThanTen: i > 10,
      stringifiedSquare: JSON.stringify(i * i),
    };
  }
});
```

Then, on the React client side, `myQuery.data` will be a state variable of an array of all the data received so far (including previous values), so you can handle it using normal React state primitives. Or if you want to handle data chunk-by-chunk, see the `trpc-client-side-usage` document.

IMPORTANT: The names of all streaming procedures _must_ end with `Stream`. For example, a procedure to get streaming updates from a chat, you might call it `getChatStream` or `chatStream`.
