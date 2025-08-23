You can save objects to Minio, which is running in Docker Compose, and available at `minioBaseUrl` (defined in `src/server/minio.ts`).

Make sure to set up bucket creation logic in `src/server/scripts/setup.ts` for any buckets that you plan to use.

When users need to be able to GET files directly, make sure to set the bucket policy accordingly. You might consider using a prefix like `public` to make it clear which files are publicly available.

When you need the Minio base URL on the client side, do not try to reconstruct it there manually. Instead, expose it via a tRPC query to the client.
