# Generated API Types

⚠️ **DO NOT EDIT THESE FILES DIRECTLY** ⚠️

These files are automatically generated from the OpenAPI schema at `openapi/finex.yaml`.

## How to update

If you need to update these types, modify the OpenAPI schema and then run:

```bash
npm run api:generate
```

This will regenerate all the types based on the updated schema.

## Requirements

- Docker must be installed and running
- The OpenAPI schema must exist at `openapi/finex.yaml`

## Troubleshooting

If you encounter a failing CI check related to API types:

1. Make sure you have the latest code: `git pull origin main`
2. Run `npm run api:generate`
3. Commit and push any changes to the generated types
