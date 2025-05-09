# Export script for Finex repository
# Creates read-only snapshots for code review

# Set parameters
$EXPORT_MODE = "bundle"  # bundle | zip | patch
$BUNDLE_REFS = "main phase5b/T-175_seed_hardening"
$TIMESTAMP = Get-Date -Format 'yyyyMMddTHHmmss'
$OUT_FILE = "finex_export.$TIMESTAMP.$EXPORT_MODE"
$OUT_PATH = "sync_export/$OUT_FILE"

# Create export based on selected mode
Write-Host "Creating $EXPORT_MODE export in sync_export directory..."

if ($EXPORT_MODE -eq "bundle") {
    git bundle create $OUT_PATH $BUNDLE_REFS
} elseif ($EXPORT_MODE -eq "zip") {
    git archive -o $OUT_PATH HEAD prisma/ lib/ tests/ package.json
} elseif ($EXPORT_MODE -eq "patch") {
    git diff main..HEAD > $OUT_PATH
}

# Verify file was created and report size
if (Test-Path $OUT_PATH) {
    $fileInfo = Get-Item $OUT_PATH
    $fileSizeMB = [math]::Round($fileInfo.Length / 1MB, 2)
    
    Write-Host ""
    Write-Host "✅ Export successful!" -ForegroundColor Green
    Write-Host "File: $OUT_FILE" -ForegroundColor Cyan
    Write-Host "Size: $fileSizeMB MB" -ForegroundColor Cyan
    Write-Host "Location: $OUT_PATH" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "To use: Drag-and-drop this file into ChatGPT for code review."
} else {
    Write-Host "❌ Export failed! File was not created." -ForegroundColor Red
}
