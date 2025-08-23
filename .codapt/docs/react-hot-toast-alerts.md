We can use `react-hot-toast` version `^2.5.2` to show pop-up alerts (toasts) as in the following example:

```
import toast from "react-hot-toast";

export function MyComponent(...) {
  async function onSomeEvent() {
    // notice alert
    toast("some message");

    // success alert
    toast.success("some message");

    // error alert
    toast.success("some error message");

    // we can also tie a toast to a promise, which will have a loading state followed by a success or error state
    const saveSettingsResult = await toast.promise(
      saveSettings(settings),
      {
        loading: "Saving...",
        success: "Settings saved!",
        error: "Could not save.",
      }
    );
    // or, alternatively
    const saveSettingsPromise = saveSettings(settings);
    void toast.promise(
      saveSettingsPromise,
      // ...
    )
    const saveSettingsResult = await saveSettingsPromise;
  };

  // ...
}
```

If we use `react-hot-toast`, we also need to add the ``<Toaster />` component to `__root.tsx`.
