# PowerShell script to check that README.md doesn't duplicate normative content from ground-truth.md
# This is used in CI to ensure documentation integrity

$README_FILE = "README.md"
$GROUND_TRUTH_FILE = "docs/ground-truth.md"

if (-not (Test-Path $README_FILE)) {
    Write-Error "ERROR: README.md file not found!"
    exit 1
}

if (-not (Test-Path $GROUND_TRUTH_FILE)) {
    Write-Error "ERROR: docs/ground-truth.md file not found!"
    exit 1
}

# List of normative headings that should only appear in ground-truth.md
$NORMATIVE_HEADING_PATTERNS = @(
    "Mission & Product",
    "Operating Principles",
    "Tech Stack Snapshot",
    "Repository Layout",
    "Database Canonical Schema",
    "OpenAPI Contract",
    "Services & Algorithms",
    "Phased Road-map",
    "Validation & Testing",
    "Security & Quality Gates",
    "Seed Data",
    "Runbooks & Monitoring",
    "Style & Lint",
    "Environment template",
    "FAQs for Agents",
    "Definition of Done"
)

$EXIT_CODE = 0
$README_CONTENT = Get-Content $README_FILE -Raw

foreach ($pattern in $NORMATIVE_HEADING_PATTERNS) {
    if ($README_CONTENT -match "(?i)##\s*$pattern") {
        Write-Error "ERROR: README.md contains normative heading: '$pattern'"
        Write-Error "       This content should only exist in docs/ground-truth.md"
        $EXIT_CODE = 1
    }
}

if ($EXIT_CODE -eq 0) {
    Write-Host "✅ README.md integrity check passed - no normative headings found" -ForegroundColor Green
} else {
    Write-Host "❌ README.md integrity check failed - normative headings found" -ForegroundColor Red
    Write-Host "   Please update README.md to link to docs/ground-truth.md instead of duplicating content" -ForegroundColor Yellow
}

# Check for deprecated paths/links 
if ($README_CONTENT -match "docs/sse-implementation\.md") {
    Write-Error "ERROR: README.md contains link to old path: docs/sse-implementation.md"
    Write-Error "       This should be updated to docs/runbooks/sse-implementation.md"
    $EXIT_CODE = 1
}

# Check for section anchor links that point to README when they should point to ground-truth
if ($README_CONTENT -match "#\d-·") {
    Write-Error "ERROR: README.md contains section anchor links in § format"
    Write-Error "       These should be updated to point to docs/ground-truth.md instead"
    $EXIT_CODE = 1
}

exit $EXIT_CODE
