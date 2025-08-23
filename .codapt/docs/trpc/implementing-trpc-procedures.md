When we want to implement a tRPC procedure, we normally have two options:

- It can be a query procedure, for fetching application data
- It can be a mutation procedure, for modifying application data

We create a separate file for each procedure in `src/server/trpc/procedures` (rather than grouping them into sub-routers or big files).

Example of a query procedure:

src/server/trpc/procedures/getPostContent.ts

```
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";

export const getPostContent = baseProcedure
  .input(z.object({ postId: z.number() }))
  .query(async ({ input }) => {
    const post = await db.post.findUnique({
      where: {
        id: input.postId,
      },
    });
    if (post === null) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Post not found",
      });
    }
    return {
      content: post.content,
    };
  });
```

Example of a mutation procedure:

src/server/trpc/procedures/updatePostContent.ts

```
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";

export const updatePostContent = baseProcedure
  .input(z.object({ authToken: z.string(), postId: z.number(), content: z.string() }))
  .mutation(async ({ input }) => {
    // we probably have some authentication logic here related to checking the auth token

    // make sure the post exists
    const post = await db.post.findUnique({
      where: {
        id: input.postId,
      },
    });
    if (post === null) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Post not found",
      });
    }

    // update the post content
    await db.post.update({
      where: {
        id: input.postId,
      },
      data: {
        content: input.content,
      },
    });
    return {
      success: true,
    };
  });
```

When we add tRPC procedures, we also need to add them in the root router in src/server/trpc/root.ts:

src/server/trpc/root.ts

```
// ...

export const appRouter = createTRPCRouter({
  // ...
  getPostContent,
  updatePostContent,
  // ...
});

// ...
```

When we are implementing pagination, we should use a `cursor` input parameter of any type and return a `nextCursor` in the response parameter in the response:

```
export const paginatedProcedure = baseProcedure
  .input(z.object({ cursor: z.string() }))
  .query(async ({ input }) => {
    // ...
    return {
      nextCursor: "...",
    };
  });
```
