Example of persisting data in localStorage

```ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type BearStore = {
  bears: number;
  addABear: () => void;
};

export const useBearStore = create<BearStore>()(
  persist(
    (set, get) => ({
      bears: 0,
      addABear: () => set({ bears: get().bears + 1 }),
    }),
    {
      name: "food-storage", // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
    },
  ),
);
```
