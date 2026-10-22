# TODO: Fix Neon Object Storage SSL hostname mismatch (localhost)

## Context
The Next.js app is running on `http://localhost:3000`. Uploads to Neon Object Storage fail with:

```text
Hostname/IP does not match certificate's altnames:
Host: products.br-old-base-b4rrgu38.storage.c-6.us-east-2.aws.neon.tech
```

The S3 client appears to be using virtual-hosted-style addressing (`bucket.endpoint`), while the TLS certificate matches only one subdomain level of `*.storage.c-6.us-east-2.aws.neon.tech`.

## Tasks for Copilot

- [x] Locate the server-side S3 client initialization and all upload/download/presigned-URL code.
- [x] Configure AWS SDK v3 `S3Client` with `forcePathStyle: true` so requests use `endpoint/bucket/key` rather than `bucket.endpoint/key`.
- [x] Verify `AWS_ENDPOINT_URL_S3` is copied exactly from the Neon console and contains the branch storage hostname, **not** the bucket name (`products`) as a hostname prefix or path suffix.
- [x] Keep the bucket name separate, e.g. `S3_BUCKET_NAME=products`, and use it as the `Bucket` parameter in S3 commands.
- [x] Confirm `AWS_REGION=us-east-2` matches the actual Neon storage endpoint region.
- [x] Load credentials from server-only environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`). Never expose these using `NEXT_PUBLIC_` or include them in client-side code.
- [x] Make sure any other S3 clients or presigned URL generators use the same path-style configuration.
- [x] Restart the Next.js dev server after editing `.env.local`.
- [x] Test uploading a small object through the storage client, then delete it. Path-style request succeeds against the configured endpoint and bucket.
- [ ] If it still fails, capture the sanitized request hostname and SDK error; do not log credentials, signatures, or full presigned URLs.
- [ ] Do **not** disable TLS verification or set `NODE_TLS_REJECT_UNAUTHORIZED=0`.

## Example server-side configuration

```ts
import 'server-only';
import { S3Client } from '@aws-sdk/client-s3';

export const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  endpoint: process.env.AWS_ENDPOINT_URL_S3!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
});
```

Example `.env.local` structure (verify actual endpoint in Neon):

```dotenv
AWS_REGION=us-east-2
AWS_ENDPOINT_URL_S3=https://br-old-base-b4rrgu38.storage.c-6.us-east-2.aws.neon.tech
S3_BUCKET_NAME=products
AWS_ACCESS_KEY_ID=<your-key>
AWS_SECRET_ACCESS_KEY=<your-secret>
```

## Acceptance criteria

- [ ] Localhost upload succeeds without TLS hostname errors.
- [ ] Uploaded object can be retrieved.
- [ ] No secret credentials appear in browser bundles or logs.
- [ ] TLS verification remains enabled.
