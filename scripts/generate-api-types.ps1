# PowerShell script for generating TypeScript API types from OpenAPI schema
# Requires: Docker Desktop for Windows

# Enable error handling
$ErrorActionPreference = "Stop"

# Helper function for colored output
function Write-ColoredOutput {
    param (
        [Parameter(Mandatory=$true)]
        [string]$Message,
        
        [Parameter(Mandatory=$false)]
        [string]$ForegroundColor = "White"
    )
    
    Write-Host $Message -ForegroundColor $ForegroundColor
}

# Get OpenAPI generator version from package.json config
$GeneratorTag = node -e "console.log(process.env.npm_package_config_openapi_generator_tag || '7.13.0')"
Write-ColoredOutput "Using OpenAPI Generator version: v$GeneratorTag" -ForegroundColor Cyan

# Check if openapi/finex.yaml exists
if (-not (Test-Path "openapi/finex.yaml")) {
    Write-ColoredOutput "ERROR: openapi/finex.yaml not found. Please create this file to generate API types." -ForegroundColor Red
    exit 1
}

# Check if Docker is available
try {
    docker --version | Out-Null
} catch {
    Write-ColoredOutput "Docker is not installed or not running. Please install Docker Desktop to generate API types." -ForegroundColor Red
    exit 1
}

# Ensure types/api directory exists
if (-not (Test-Path "types/api")) {
    Write-ColoredOutput "Creating types/api directory..." -ForegroundColor Yellow
    New-Item -Path "types/api" -ItemType Directory -Force | Out-Null
}

Write-ColoredOutput "Generating TypeScript API client from OpenAPI schema..." -ForegroundColor Yellow

# Convert Windows path to Docker path format
$CurrentDir = (Get-Location).Path.Replace('\', '/').Replace('C:/', '/c/')
if ($CurrentDir.StartsWith('C:')) {
    $DockerPath = $CurrentDir.Replace('C:', '/c')
} else {
    $DockerPath = $CurrentDir
}

# Generate TypeScript-fetch client
try {
    # Using proper Windows-compatible Docker mount syntax
    docker run --rm -v "${pwd}:/local" "openapitools/openapi-generator-cli:v$GeneratorTag" generate `
        -i /local/openapi/finex.yaml `
        -g typescript-fetch `
        -o /local/types/api
} catch {
    Write-ColoredOutput "Failed to generate API types. Error: $_" -ForegroundColor Red
    exit 1
}

# Create a README in the generated directory
$ReadmeContent = @'
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
'@

Set-Content -Path "types/api/README-GENERATED_DO_NOT_EDIT.md" -Value $ReadmeContent

Write-ColoredOutput "API types generated successfully!" -ForegroundColor Green
