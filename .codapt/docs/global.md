This is a full-stack TypeScript application. We use:

- TanStack Router
- React
- tRPC
- Prisma ORM
- Tailwind CSS
- `@tailwindcss/forms`
- HeadlessUI (`@headlessui/react`)
- Zod
- Docker & Docker Compose
- Zustand & Zustand Persist middleware

Whenever possible, try to break up large pages and components into smaller components in their own files.

When storing data like auth tokens, we should use Zustand Persist.

You can import from `src/...` with the alias `~/...`. Always use `~/...` imports over relative imports whenever possible.

Keep server-specific code in `src/server`, and avoid importing files in `src/server` from files outside of `src/server`. This helps maintain clean client-server separation.

Never use headers with tRPC. Pass all data, including authentication tokens, as parameters. Avoid using tRPC middleware -- use helper functions in procedures to handle things like authentication.

For all frontend components, focus on good design, using your own judgement when there is not a clear intended direction. Take two passes at each component/page -- first, implement the functionality, then re-visit it to improve the design as per any specifications or best practices.

When you're creating pages that don't wrap other pages, **always** include "index.tsx" in the filename so that we don't accidentally have clashing routes. See the `tanstack-router/pages` document for details. For example, rather than `some-page.tsx`, use `some-page/index.tsx` or `some-page.index.tsx`.

Put non-route components in the `src/components` directory.

When you use new packages/libraries, make sure to read documents related to them. You do not need to modify `package.json` to install them -- our developer tooling will automatically update `package.json` and install new dependencies when we run the app.

Use Tailwind CSS for styling without custom styles wherever possible. Custom styles should only be used as a last resort.

Use `lucide-react` version `^0.510.0` for icons.

⁠Use your own judgment and taste when the design direction is ambiguous. Aim for quality on par with great well-known products. Follow atomic design principles (small, reusable components).

At runtime, there will be an auto-generated `routeTree.gen.ts`. You can assume that this will be generated correctly; feel free to import from it.

Our app runs in a managed runtime environment, which automatically runs scripts like `.codapt/scripts/run`. These scripts most likely do not need to be modified.

Any logic that should be run every time the app starts, such as seeding database data, can be added to `src/server/scripts/setup.ts`.

When using tRPC via hooks, make sure to assign each one before using it. For example:

```
const trpc = useTRPC();
const someMutation = useMutation(trpc.someProcedure.mutationOptions(...));
```

If you ever write the pattern `trpc.someProcedure.useQuery(...)`, or `trpc.someProcedure.useMutation(...)`, modify the file again to use the correct pattern as shown above.
