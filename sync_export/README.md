# Finex Code Export Utilities

This directory contains utilities for creating code exports that can be shared with ChatGPT for review.

## Available Tools

### export.ps1 PowerShell Script

A configurable PowerShell script that can create different types of exports:

- **Bundle mode**: Creates a Git bundle containing full repository history
- **Zip mode**: Creates a ZIP archive of the current working tree
- **Patch mode**: Creates a patch file with changes compared to main branch

### Usage

1. Open PowerShell in the project root
2. Edit `sync_export/export.ps1` to configure the export type (bundle/zip/patch)
3. Run: `powershell -ExecutionPolicy Bypass -File .\sync_export\export.ps1`
4. The export file will be created in this directory
5. Drag-and-drop the file into ChatGPT for code review

### Quick Export Commands

For convenience, you can also use these one-liners:

```powershell
# Export specific directories to a ZIP
$timestamp = Get-Date -Format 'yyyyMMddTHHmmss'; $output_file = "sync_export/finex_export.$timestamp.zip"; Compress-Archive -Path lib, prisma, tests, package.json -DestinationPath $output_file

# Export entire project (excluding node_modules, etc.)
$timestamp = Get-Date -Format 'yyyyMMddTHHmmss'; $output_file = "sync_export/finex_export_full.$timestamp.zip"; $exclude = @("node_modules", "sync_export", ".git", ".next"); Get-ChildItem -Path . -Exclude $exclude | Compress-Archive -DestinationPath $output_file
```

## Workflow Integration

These tools are particularly useful when working on:

1. T-175: Seed hardening - Export the changes for review before merging
2. T-176: Removing @ts-nocheck from production code - Get feedback on type fixes
3. T-177: Removing @ts-nocheck from test infrastructure - Validate test refactoring
