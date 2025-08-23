# Search Params in TanStack Router

TanStack Router provides powerful handling of URL search params, allowing you to use them as typed, validated application state.

## JSON-first Search Params

TanStack Router automatically converts URL search params to structured JSON data types. This means you can store complex data in your search params:

```tsx
const link = (
  <Link
    to="/shop"
    search={{
      pageIndex: 3,
      includeCategories: ["electronics", "gifts"],
      sortBy: "price",
      desc: true,
    }}
  />
);
```

This creates the URL:

```
/shop?pageIndex=3&includeCategories=%5B%22electronics%22%2C%22gifts%22%5D&sortBy=price&desc=true
```

And the router automatically parses it back to structured data:

```json
{
  "pageIndex": 3,
  "includeCategories": ["electronics", "gifts"],
  "sortBy": "price",
  "desc": true
}
```

## Validating and Typing Search Params with Zod

To ensure type safety, validate your search params using the `validateSearch` option:

```tsx
// /routes/shop.products.tsx
import { z } from "zod";
import { createFileRoute } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";

const productSearchSchema = z.object({
  page: z.number().default(1),
  filter: z.string().default(""),
  sort: z.enum(["newest", "oldest", "price"]).default("newest"),
});

export const Route = createFileRoute("/shop/products")({
  validateSearch: zodValidator(productSearchSchema),
});
```

Using the Zod adapter ensures correct typing of both input and output. Now you can navigate without explicitly providing search params:

```tsx
<Link to="/shop/products" />
```

For better type handling with fallbacks, use the `fallback` helper:

```tsx
import { fallback, zodValidator } from "@tanstack/zod-adapter";

const productSearchSchema = z.object({
  page: fallback(z.number(), 1).default(1),
  filter: fallback(z.string(), "").default(""),
  sort: fallback(z.enum(["newest", "oldest", "price"]), "newest").default(
    "newest",
  ),
});
```

## Reading Search Params

### In Components

Access search params with the `useSearch` hook:

```tsx
// Using route-specific hook
const ProductList = () => {
  const { page, filter, sort } = Route.useSearch();
  return <div>...</div>;
};

// OR using the generic hook
const ProductList = () => {
  const routeApi = getRouteApi("/shop/products");
  const { page, filter, sort } = routeApi.useSearch();
  return <div>...</div>;
};
```

### Inherited from Parent Routes

Child routes inherit search params from parent routes:

```tsx
// shop.products.$productId.tsx
export const Route = createFileRoute("/shop/products/$productId")({
  beforeLoad: ({ search }) => {
    // search has the ProductSearch type
    console.log(search.page, search.filter, search.sort);
  },
});
```

## Writing Search Params

### Using Link Component

```tsx
const ProductList = () => {
  return (
    <div>
      <Link from="/shop/products" search={(prev) => ({ page: prev.page + 1 })}>
        Next Page
      </Link>
    </div>
  );
};
```

For updating search across routes, use `to="."`:

```tsx
const PageSelector = () => {
  return (
    <div>
      <Link to="." search={(prev) => ({ ...prev, page: prev.page + 1 })}>
        Next Page
      </Link>
    </div>
  );
};
```

### Using navigate Function

```tsx
const ProductList = () => {
  const navigate = useNavigate({ from: "/shop/products" });

  return (
    <button
      onClick={() => {
        navigate({
          search: (prev) => ({ page: prev.page + 1 }),
        });
      }}
    >
      Next Page
    </button>
  );
};
```

## Search Middlewares

Search middlewares transform search params before generating links:

### Retaining Search Params

```tsx
import { createRootRoute, retainSearchParams } from "@tanstack/react-router";

export const Route = createRootRoute({
  validateSearch: zodValidator(
    z.object({
      rootValue: z.string().optional(),
    }),
  ),
  search: {
    middlewares: [retainSearchParams(["rootValue"])],
  },
});
```

### Stripping Default Values

```tsx
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";

const defaultValues = {
  one: "abc",
  two: "xyz",
};

export const Route = createFileRoute("/hello")({
  validateSearch: zodValidator(
    z.object({
      one: z.string().default(defaultValues.one),
      two: z.string().default(defaultValues.two),
    }),
  ),
  search: {
    middlewares: [stripSearchParams(defaultValues)],
  },
});
```

### Combining Middlewares

```tsx
export const Route = createFileRoute("/search")({
  validateSearch: zodValidator(
    z.object({
      retainMe: z.string().optional(),
      arrayWithDefaults: z.string().array().default(["foo", "bar"]),
      required: z.string(),
    }),
  ),
  search: {
    middlewares: [
      retainSearchParams(["retainMe"]),
      stripSearchParams({ arrayWithDefaults: ["foo", "bar"] }),
    ],
  },
});
```
