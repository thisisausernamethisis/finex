# FinEx Repository Archive Tool

This document explains how to use the `finex_archive.ps1` script for creating clean, well-structured archives of the FinEx codebase for export.

## Overview

The `finex_archive.ps1` script creates a Git-native archive that preserves the exact directory structure of the repository. It's designed to be CI-friendly with no interactive prompts, making it suitable for both development workflows and automated builds.

## Key Features

- **Git-native archiving**: Uses `git archive` to ensure every tracked file appears exactly once
- **Non-interactive operation**: All prompts can be bypassed with parameters (CI-friendly)
- **Untracked files support**: Can include untracked files like mocks and test fixtures using `-IncludeUntracked`
- **Verification options**: Optional npm verification and build steps
- **Structure validation**: Ensures directory structure is properly preserved
- **Detailed logging**: Color-coded messages show the archive creation progress

## Usage Examples

### Basic Usage

```powershell
# Creates finex_app_YYYYMMDD.zip with all tracked files
# Runs verification and build steps
.\sync_export\finex_archive.ps1
```

### Including Untracked Files

```powershell
# Include untracked files like mocks and local config
# Useful for development environments
.\sync_export\finex_archive.ps1 -IncludeUntracked
```

### Creating Quick CI Archive

```powershell
# Skip verification and build steps, use custom filename
# Perfect for CI/CD pipelines
.\sync_export\finex_archive.ps1 -OutFile "finex_ci_export.zip" -SkipVerify -SkipBuild
```

### Additional Options

```powershell
# Show more detailed output including list of untracked files
.\sync_export\finex_archive.ps1 -IncludeUntracked -Verbose
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `-OutFile` | string | The output zip filename. Defaults to "finex_app_YYYYMMDD.zip" with current date. |
| `-SkipVerify` | switch | Skip the npm ci && npm run verify steps. |
| `-SkipBuild` | switch | Skip the npm run build step. |
| `-IncludeUntracked` | switch | Include untracked files in the archive (for mocks and local config). |
| `-Verbose` | switch | Show more detailed output during the archiving process. |

## Handling Mock Files

If you are creating an archive that needs to include Jest mock files in the `__mocks__` directory, you have two options:

### Option 1: Include as untracked files (development exports)

```powershell
.\sync_export\finex_archive.ps1 -IncludeUntracked
```

This is ideal for development exports where you don't want to permanently commit the mock files to the repository.

### Option 2: Track mock files in Git (CI/CD pipelines)

```bash
# First, track the mock files
git add tests/__mocks__
git commit -m "chore: track mocks for CI export"

# Then create the archive normally
.\sync_export\finex_archive.ps1
```

This approach ensures mock files are included in all CI/CD pipeline archives consistently.

## Verification

After extraction, you can verify the integrity of the archive with:

```bash
# Check that all routes are in their correct folders
unzip -l finex_app_20250511.zip | grep -E '(^|/)route\.ts$'

# Verify there are no duplicated files
unzip -l finex_app_20250511.zip | sort | uniq -d
```

Both commands should confirm that the directory structure is intact.
