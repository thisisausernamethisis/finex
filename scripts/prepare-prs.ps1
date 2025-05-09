# PowerShell script to prepare PRs for T-175 and template-search-fix

# Script parameters
param(
    [string]$branchName = "phase5b/T-175_seed_hardening",
    [string]$fixBranchName = "fix/template-search-mock"
)

# Function to check if git is available
function Check-GitAvailable {
    try {
        git --version | Out-Null
        return $true
    } catch {
        Write-Error "Git is not available on this system or not in PATH"
        return $false
    }
}

# Function to commit changes to current branch
function Commit-CurrentChanges {
    param([string]$commitMessage)
    
    git add .
    git commit -m $commitMessage
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to commit changes"
        exit 1
    }
    
    Write-Output "Changes committed successfully"
}

# Function to create a new branch
function Create-Branch {
    param([string]$branchName)
    
    git checkout -b $branchName
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to create branch $branchName"
        exit 1
    }
    
    Write-Output "Branch $branchName created successfully"
}

# Main script execution

# Check if git is available
if (-not (Check-GitAvailable)) {
    exit 1
}

# Check current branch
$currentBranch = git branch --show-current
Write-Output "Current branch: $currentBranch"
Write-Output ""

# Commit T-175 changes
Write-Output "Committing changes for T-175 seed hardening..."
Commit-CurrentChanges "T-175: Add deterministic seeding with SEED_UID, cross-env, and documentation"
Write-Output ""

# Stash template search changes for separate PR
Write-Output "Creating branch for template search fixes..."
