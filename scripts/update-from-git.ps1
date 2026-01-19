# Update Uptime Awan from Git and Reinstall Dependencies (PowerShell)
# For Windows development

param(
    [switch]$Force,
    [switch]$Build
)

$ErrorActionPreference = "Stop"

# Colors for output
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

Write-Output "=========================================="
Write-Output "Uptime Awan - Update from Git"
Write-Output "=========================================="
Write-Output ""

# Get project directory
$ProjectDir = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectDir

# Check if git repository exists
if (-not (Test-Path ".git")) {
    Write-ColorOutput Red "Error: Not a git repository"
    Write-Output "Please run this script from the project root directory."
    exit 1
}

# Check current branch
$CurrentBranch = git branch --show-current
Write-ColorOutput Blue "Current branch: $CurrentBranch"
Write-Output ""

# Step 1: Check for uncommitted changes
Write-ColorOutput Yellow "Step 1: Checking for uncommitted changes..."
$UncommittedChanges = git diff-index --quiet HEAD --
if (-not $UncommittedChanges) {
    Write-ColorOutput Yellow "Warning: You have uncommitted changes"
    $Response = Read-Host "Do you want to stash them? (y/N)"
    if ($Response -eq "y" -or $Response -eq "Y") {
        Write-Output "Stashing changes..."
        git stash
        $Stashed = $true
    } else {
        Write-ColorOutput Red "Aborting. Please commit or stash your changes first."
        exit 1
    }
} else {
    $Stashed = $false
}

# Step 2: Pull latest changes
Write-Output ""
Write-ColorOutput Yellow "Step 2: Pulling latest changes from git..."
try {
    git pull origin $CurrentBranch
    Write-ColorOutput Green "✓ Successfully pulled latest changes"
} catch {
    Write-ColorOutput Red "✗ Failed to pull changes"
    if ($Stashed) {
        Write-Output "Restoring stashed changes..."
        git stash pop
    }
    exit 1
}

# Step 3: Check if package.json changed
Write-Output ""
Write-ColorOutput Yellow "Step 3: Checking for dependency changes..."
$PackageJsonChanged = $false
$ClientPackageJsonChanged = $false

$ChangedFiles = git diff HEAD@{1} HEAD --name-only
if ($ChangedFiles -match "package\.json$") {
    $PackageJsonChanged = $true
    Write-ColorOutput Blue "package.json has changed - dependencies need to be reinstalled"
}
if ($ChangedFiles -match "client\\package\.json$") {
    $ClientPackageJsonChanged = $true
    Write-ColorOutput Blue "client/package.json has changed - client dependencies need to be reinstalled"
}

# Step 4: Reinstall server dependencies
Write-Output ""
Write-ColorOutput Yellow "Step 4: Reinstalling server dependencies..."
if ($PackageJsonChanged -or $Force) {
    Write-Output "Removing old node_modules and package-lock.json..."
    if (Test-Path "node_modules") { Remove-Item -Recurse -Force "node_modules" }
    if (Test-Path "package-lock.json") { Remove-Item -Force "package-lock.json" }
    
    Write-Output "Installing dependencies (this may take a few minutes)..."
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput Green "✓ Server dependencies installed successfully"
    } else {
        Write-ColorOutput Red "✗ Failed to install server dependencies"
        exit 1
    }
} else {
    Write-ColorOutput Blue "Skipping (package.json unchanged, use -Force to reinstall)"
}

# Step 5: Reinstall client dependencies
Write-Output ""
Write-ColorOutput Yellow "Step 5: Reinstalling client dependencies..."
Set-Location "client"

if ($ClientPackageJsonChanged -or $Force) {
    Write-Output "Removing old node_modules and package-lock.json..."
    if (Test-Path "node_modules") { Remove-Item -Recurse -Force "node_modules" }
    if (Test-Path "package-lock.json") { Remove-Item -Force "package-lock.json" }
    
    Write-Output "Installing dependencies (this may take a few minutes)..."
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput Green "✓ Client dependencies installed successfully"
    } else {
        Write-ColorOutput Red "✗ Failed to install client dependencies"
        Set-Location ..
        exit 1
    }
} else {
    Write-ColorOutput Blue "Skipping (client/package.json unchanged, use -Force to reinstall)"
}

Set-Location ..

# Step 6: Rebuild client (if requested)
Write-Output ""
if ($Build -or $env:NODE_ENV -eq "production") {
    Write-ColorOutput Yellow "Step 6: Rebuilding client application..."
    Set-Location "client"
    npm run build
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput Green "✓ Client application rebuilt successfully"
    } else {
        Write-ColorOutput Red "✗ Failed to rebuild client application"
        Set-Location ..
        exit 1
    }
    Set-Location ..
} else {
    Write-ColorOutput Blue "Skipping client build (use -Build to force)"
}

# Step 7: Restore stashed changes (if any)
if ($Stashed) {
    Write-Output ""
    Write-ColorOutput Yellow "Restoring stashed changes..."
    git stash pop
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput Green "✓ Stashed changes restored"
    } else {
        Write-ColorOutput Yellow "⚠ There were conflicts when restoring stashed changes"
        Write-Output "Please resolve them manually with: git stash list"
    }
}

# Summary
Write-Output ""
Write-Output "=========================================="
Write-ColorOutput Green "Update Complete!"
Write-Output "=========================================="
Write-Output ""
Write-Output "Next steps:"
Write-Output "1. Restart the development server:"
Write-ColorOutput Blue "   npm run dev"
Write-Output ""
