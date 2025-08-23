We can use `zustand` version `^5.0.3`.

## First create a store

Your store is a hook!
You can put anything in it: primitives, objects, functions.
The `set` function _merges_ state.

Note that you have to write create<T>()(...) (notice the extra parentheses () too along with the type parameter) where T is the type of the state to annotate it. For example:

```ts
import { create } from "zustand";

interface BearState {
  bears: number;
  increase: (by: number) => void;
}

const useBearStore = create<BearState>()((set) => ({
  bears: 0,
  increase: (by) => set((state) => ({ bears: state.bears + by })),
}));
```

## Then bind your components

You can use the hook anywhere, without the need of providers.
Select your state and the consuming component
will re-render when that state changes.

```tsx
function BearCounter() {
  const bears = useStore((state) => state.bears);
  return <h1>{bears} bears around here...</h1>;
}

function Controls() {
  const increasePopulation = useStore((state) => state.increasePopulation);
  return <button onClick={increasePopulation}>one up</button>;
}
```

## Computed values

You should not try to create computed values as functions in the state. Instead, create new custom hooks for them. For example:

```tsx
const useSquaredBears = () =>
  Math.pow(
    useStore((state) => state.bears),
    2,
  );
```
