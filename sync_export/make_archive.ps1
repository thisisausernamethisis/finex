<#
.SYNOPSIS
    Creates a complete archive of the finex_v3 directory for AI analysis.
.DESCRIPTION
    This script creates a zip archive of the entire project directory structure,
    regardless of git status. It includes all files (including uncommitted ones)
    to provide a complete snapshot for AI analysis.
#>

# Script locations
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptPath

# Create timestamp-based filename (YYYYMMDD_HHMMSS format for uniqueness)
$dateStamp = Get-Date -Format "yyyyMMdd_HHmmss"
$zipFileName = "finex_full_${dateStamp}.zip"
$outputPath = Join-Path $scriptPath $zipFileName

# Directories to exclude from the archive
$excludedDirs = @(
    # External modules and package directories
    "node_modules",
    ".next",
    "dist",
    "coverage",
    
    # Git directories
    ".git",
    
    # The sync_export directory itself (to avoid zipping old zips)
    "sync_export"
)

# Display start message
Write-Host "Creating complete project archive..." -ForegroundColor Cyan
Write-Host "Source: $projectRoot" -ForegroundColor Gray
Write-Host "Target: $outputPath" -ForegroundColor Gray
Write-Host "Excluded directories: $($excludedDirs -join ', ')" -ForegroundColor Gray

# Get all files to include (excluding directories in $excludedDirs)
$filesToInclude = Get-ChildItem -Path $projectRoot -Recurse -File | Where-Object {
    $include = $true
    foreach ($dir in $excludedDirs) {
        if ($_.FullName -like "*\$dir\*") {
            $include = $false
            break
        }
    }
    $include
}

Write-Host "Found $($filesToInclude.Count) files to archive" -ForegroundColor Gray

# Create a temporary directory to prepare files while keeping structure
$tempDir = Join-Path $env:TEMP "finex_archive_temp"
if (Test-Path $tempDir) {
    Remove-Item -Path $tempDir -Recurse -Force
}
New-Item -Path $tempDir -ItemType Directory | Out-Null

# Create the archive
try {
    # Copy files to temp directory with structure
    Write-Host "Copying files to temporary location..." -ForegroundColor Gray
    $filesProcessed = 0
    
    foreach ($file in $filesToInclude) {
        # Get the relative path to maintain directory structure
        $relativePath = $file.FullName.Substring($projectRoot.Length + 1)
        $destPath = Join-Path $tempDir $relativePath
        $destDir = Split-Path -Parent $destPath
        
        # Create destination directory if it doesn't exist
        if (-not (Test-Path $destDir)) {
            New-Item -Path $destDir -ItemType Directory -Force | Out-Null
        }
        
        # Copy file
        Copy-Item -Path $file.FullName -Destination $destPath -Force | Out-Null
        
        $filesProcessed++
        if ($filesProcessed % 100 -eq 0) {
            Write-Host "  Copied $filesProcessed files..." -ForegroundColor Gray
        }
    }
    
    # Create the zip file using Compress-Archive
    Write-Host "Compressing files into archive..." -ForegroundColor Gray
    $compressParams = @{
        Path = "$tempDir\*"
        DestinationPath = $outputPath
        CompressionLevel = "Optimal"
    }
    Compress-Archive @compressParams
    
    # Report success
    Write-Host "`nArchive creation complete!" -ForegroundColor Green
    Write-Host "Archive: $outputPath" -ForegroundColor Cyan
    Write-Host "Size: $([Math]::Round((Get-Item $outputPath).Length / 1MB, 2)) MB" -ForegroundColor Cyan
    Write-Host "Files included: $filesProcessed" -ForegroundColor Cyan
    # Clean up temp directory
    Remove-Item -Path $tempDir -Recurse -Force
    
    # Verify the archive was created
    if (-not (Test-Path $outputPath)) {
        throw "Archive file was not created"
    }
} 
catch {
    Write-Host "Error creating archive: $_" -ForegroundColor Red
    if (Test-Path $outputPath) {
        Remove-Item $outputPath -Force
        Write-Host "Removed incomplete archive file" -ForegroundColor Yellow
    }
    if (Test-Path $tempDir) {
        Remove-Item -Path $tempDir -Recurse -Force
        Write-Host "Removed temporary directory" -ForegroundColor Yellow
    }
    exit 1
}

Write-Host "`nThis archive contains the complete project including uncommitted files." -ForegroundColor Yellow
Write-Host "It can be shared with AI tools for comprehensive project analysis." -ForegroundColor Yellow
