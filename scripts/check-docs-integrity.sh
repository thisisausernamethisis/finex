#!/usr/bin/env bash

# Script to check that README.md doesn't duplicate normative content from ground-truth.md
# This is used in CI to ensure documentation integrity

set -euo pipefail

README_FILE="README.md"
GROUND_TRUTH_FILE="docs/ground-truth.md"

if [ ! -f "$README_FILE" ]; then
  echo "ERROR: README.md file not found!"
  exit 1
fi

if [ ! -f "$GROUND_TRUTH_FILE" ]; then
  echo "ERROR: docs/ground-truth.md file not found!"
  exit 1
fi

# List of normative headings that should only appear in ground-truth.md
NORMATIVE_HEADING_PATTERNS=(
  "Mission & Product"
  "Operating Principles"
  "Tech Stack Snapshot"
  "Repository Layout"
  "Database Canonical Schema"
  "OpenAPI Contract"
  "Services & Algorithms"
  "Phased Road-map"
  "Validation & Testing"
  "Security & Quality Gates"
  "Seed Data"
  "Runbooks & Monitoring"
  "Style & Lint"
  "Environment template"
  "FAQs for Agents"
  "Definition of Done"
)

EXIT_CODE=0

for pattern in "${NORMATIVE_HEADING_PATTERNS[@]}"; do
  if grep -iE "## *${pattern}" "$README_FILE" > /dev/null; then
    echo "ERROR: README.md contains normative heading: '${pattern}'"
    echo "       This content should only exist in docs/ground-truth.md"
    EXIT_CODE=1
  fi
done

if [ $EXIT_CODE -eq 0 ]; then
  echo "✅ README.md integrity check passed - no normative headings found"
else
  echo "❌ README.md integrity check failed - normative headings found"
  echo "   Please update README.md to link to docs/ground-truth.md instead of duplicating content"
fi

# Check for deprecated paths/links 
if grep -E "docs/sse-implementation.md" "$README_FILE" > /dev/null; then
  echo "ERROR: README.md contains link to old path: docs/sse-implementation.md"
  echo "       This should be updated to docs/runbooks/sse-implementation.md"
  EXIT_CODE=1
fi

# Check for section anchor links that point to README when they should point to ground-truth
if grep -E "#\d-·" "$README_FILE" > /dev/null; then
  echo "ERROR: README.md contains section anchor links in § format"
  echo "       These should be updated to point to docs/ground-truth.md instead"
  EXIT_CODE=1
fi

exit $EXIT_CODE
