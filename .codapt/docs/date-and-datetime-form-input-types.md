When using `date` or `datetime-local` input type, here is how we can pass the data to the backend and properly parse it:

Frontend:

```
// This converts the string to a Date object
<input
  type="datetime-local" {* or `date` *}
  {...register('eventDate')}
/>

// Now this works:
const onSubmit = (data) => {
  mutation.mutate({
    eventDate: new Date(data.eventDate).toISOString() // ✅ Works!
  });
};
```

Backend:

Just use `z.string().datetime()` or `z.string().date()` to parse it.
