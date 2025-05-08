#!/bin/bash
set -e

# Get OpenAPI generator version from package.json config
GENERATOR_TAG=$(node -e "console.log(process.env.npm_package_config_openapi_generator_tag || '7.13.0')")
echo "ℹ️ Using OpenAPI Generator version: v$GENERATOR_TAG"

# Check if openapi/finex.yaml exists
if [ ! -f "openapi/finex.yaml" ]; then
  echo "❌ ERROR: openapi/finex.yaml not found. Please create this file to generate API types."
  exit 1
fi

# Check if Docker is available
if ! command -v docker &> /dev/null; then
  echo "❌ Docker is not installed or not in PATH. Please install Docker to generate API types."
  exit 1
fi

# Ensure types/api directory exists
mkdir -p types/api

echo "🔄 Generating TypeScript API client from OpenAPI schema..."

# Generate TypeScript-fetch client
docker run --rm -v "$(pwd):/local" "openapitools/openapi-generator-cli:v$GENERATOR_TAG" generate \
  -i /local/openapi/finex.yaml \
  -g typescript-fetch \
  -o /local/types/api

# Create a README in the generated directory
cat > types/api/README-GENERATED_DO_NOT_EDIT.md << 'EOL'
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
EOL

echo "✅ API types generated successfully!"
