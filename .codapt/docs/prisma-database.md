Models are stored in `prisma/schema.prisma`.

In the backend, we can access the database via Prisma. Here's an example:

```
import { db } from "~/server/db";

// ...
await db.someTable.create({
  data: {
    someField: "some value",
  }
})
// ...
```

Our runtime environment automatically migrates data, so do not try to generate Prisma migrations.

Since our runtime environment uses `prisma db push`, if we're ever resolving migration errors from the server logs, we should update the database schema such that `prisma db push` will work effectively. We should never create migrations.

For primary keys, always use autoincrement integer unless specified otherwise. Do not include an `updatedAt` field unless needed.
