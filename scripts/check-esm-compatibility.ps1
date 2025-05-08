# PowerShell script for checking ESM compatibility issues
# Scans for CommonJS module patterns that could cause issues in ESM environments

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

Write-ColoredOutput "Scanning for CommonJS module patterns..." -ForegroundColor Cyan

# File patterns to scan
$filePatterns = @("*.js", "*.ts", "*.jsx", "*.tsx")
$excludeDirs = @("node_modules", ".next", "dist", "build", "out")

# Build exclude pattern for directories
$excludePattern = $excludeDirs -join '|'

# Search patterns
$patterns = @(
    "module.exports",
    "exports\." # This will catch both exports.foo = bar and exports.default = baz patterns
)

$cjsFiles = @()

foreach ($pattern in $patterns) {
    Write-ColoredOutput "Searching for pattern: $pattern" -ForegroundColor Yellow
    
    # Use Get-ChildItem to find all files matching pattern, excluding specific directories
    $files = Get-ChildItem -Path . -Include $filePatterns -Recurse | 
             Where-Object { $_.FullName -notmatch "\\($excludePattern)\\" } |
             Select-String -Pattern $pattern -List
    
    if ($files.Count -gt 0) {
        $cjsFiles += $files
        $groupedFiles = $files | Select-Object -Property Path -Unique
        
        Write-ColoredOutput "Found $($groupedFiles.Count) files with pattern '$pattern':" -ForegroundColor Yellow
        foreach ($file in $groupedFiles) {
            Write-Host "  - $($file.Path)"
        }
    } else {
        Write-ColoredOutput "No files found with pattern '$pattern'." -ForegroundColor Green
    }
}

# Summary
if ($cjsFiles.Count -gt 0) {
    $uniqueFiles = $cjsFiles | Select-Object -Property Path -Unique
    Write-ColoredOutput "`nTotal: Found $($uniqueFiles.Count) files with CommonJS patterns that may need to be updated for ESM compatibility." -ForegroundColor Red
    Write-Host "Consider converting these to use ESM syntax: import/export statements."
    exit 1
} else {
    Write-ColoredOutput "`nNo CommonJS patterns found! Your codebase appears to be ESM-compatible." -ForegroundColor Green
    exit 0
}
