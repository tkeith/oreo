You can allow users to upload files directly to minio by generating presigned URLs.

You can use this Minio function: `presignedPutObject(bucketName: string, objectName: string, expires?: number): Promise<string>`
