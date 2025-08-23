Here's how you can define a tRPC subscription procedure which can push updated data to the client when state changes:

```
export const someSubscriptionProcedure = baseProcedure
  .input(
    z.object({
      // ...
    }),
  )
  .subscription(async function* ({ input }) {
    while (true) {
      // ...
      yield {
        some: "data",
      };
      // ...
    }
  });
```

Always use async generator functions for subscriptions! Observables are no longer acceptable as tRPC subscriptions.

To see how to consume subscriptions on the client side, see `trpc-client-side-usage`.
