We use `react-hook-form` version `^7.56.1` and `@hookform/resolvers` version `^5.0.1` for form handling.

Example of a form:

```
import { useForm } from "react-hook-form";

export function SomeForm(...) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ someField: string; anotherField: string }>();

  const onSubmit = ({
    someField,
    anotherField,
  }: {
    someField: string;
    anotherField: string;
  }) => {
    // do something
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label
          htmlFor="someField"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          someField
        </label>
        <input
          id="someField"
          type="text"
          {...register("someField", { required: "someField is required" })}
          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none"
        />
        {errors.someField && (
          <p className="mt-1 text-sm text-red-600">{errors.someField.message}</p>
        )}
      </div>
      <div>
        <label
          htmlFor="anotherField"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          anotherField
        </label>
        <input
          id="anotherField"
          type="text"
          {...register("anotherField", { required: "anotherField is required" })}
          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none"
        />
        {errors.anotherField && (
          <p className="mt-1 text-sm text-red-600">{errors.anotherField.message}</p>
        )}
      </div>
      <button
        type="submit"
        disabled={/* check whether the submission action is running, for example isPending on a mutation or an isSubmitting state variable */}
        className="w-full rounded-md bg-gray-800 py-2 text-sm font-semibold text-white hover:bg-gray-700 disabled:bg-gray-400"
      >
        {... ? "Submitting..." : "Submit"}
      </button>
    </form>
  );
}
```

We can also use `@hookform/resolvers/zod` to use zod for form validation:

```
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const schema = z.object({
  name: z.string().min(1, { message: 'Required' }),
  age: z.number().min(10),
});

export function MyComponent() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });

  return (
    <form onSubmit={handleSubmit((d) => console.log(d))}>
      <input {...register('name')} />
      {errors.name?.message && <p>{errors.name?.message}</p>}
      <input type="number" {...register('age', { valueAsNumber: true })} />
      {errors.age?.message && <p>{errors.age?.message}</p>}
      <input type="submit" />
    </form>
  );
};
```
