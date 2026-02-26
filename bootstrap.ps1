Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Step {
    param([string]$Message)
    Write-Host "`n==> $Message" -ForegroundColor Cyan
}

function Test-Command {
    param([string]$Name)
    return $null -ne (Get-Command $Name -ErrorAction SilentlyContinue)
}

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$serverDir = Join-Path $repoRoot 'server'
$frontendDir = Join-Path $repoRoot 'frontend'
$venvDir = Join-Path $serverDir '.venv'
$venvPython = Join-Path $venvDir 'Scripts\python.exe'

Write-Host "Project root: $repoRoot" -ForegroundColor Yellow

Write-Step "Checking required tools"
$missing = @()
if (-not (Test-Command 'python')) { $missing += 'python' }
if (-not (Test-Command 'npm')) { $missing += 'npm' }

if ($missing.Count -gt 0) {
    Write-Host "Missing required tools: $($missing -join ', ')" -ForegroundColor Red
    Write-Host "Install them first, then rerun this script." -ForegroundColor Red
    exit 1
}

if (-not (Test-Command 'ollama')) {
    Write-Host "Ollama not found in PATH. AI chat routes need Ollama + llama3." -ForegroundColor Yellow
    Write-Host "Install Ollama, then run: ollama pull llama3" -ForegroundColor Yellow
} else {
    Write-Host "Ollama found. Ensure model exists: ollama pull llama3" -ForegroundColor Green
}

Write-Step "Ensuring simulation CSV is available in server folder"
$csvCandidates = @(
    (Join-Path $repoRoot 'large_simulation_log.csv'),
    (Join-Path (Split-Path $repoRoot -Parent) 'large_simulation_log.csv'),
    (Join-Path (Split-Path (Split-Path $repoRoot -Parent) -Parent) 'large_simulation_log.csv')
)
$csvSource = $csvCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
$csvDest = Join-Path $serverDir 'large_simulation_log.csv'

if ($csvSource) {
    Copy-Item -Path $csvSource -Destination $csvDest -Force
    Write-Host "Copied CSV to: $csvDest" -ForegroundColor Green
} else {
    Write-Host "Could not find large_simulation_log.csv automatically." -ForegroundColor Yellow
    Write-Host "Place it at: $csvDest" -ForegroundColor Yellow
}

Write-Step "Setting up Python virtual environment for server"
if (-not (Test-Path $venvPython)) {
    Push-Location $serverDir
    python -m venv .venv
    Pop-Location
}

Write-Step "Installing backend Python dependencies"
& $venvPython -m pip install --upgrade pip
& $venvPython -m pip install -r (Join-Path $serverDir 'requirements.txt')

Write-Step "Installing frontend Node dependencies"
Push-Location $frontendDir
npm install
Pop-Location

Write-Step "Bootstrap complete"
Write-Host "Next steps:" -ForegroundColor Green
Write-Host "1) Configure PostgreSQL database and credentials in server/database.py" -ForegroundColor Green
Write-Host "2) Start backend:  cd server; .\.venv\Scripts\Activate.ps1; uvicorn main:app --reload --port 8000" -ForegroundColor Green
Write-Host "3) Start frontend: cd frontend; npm run dev" -ForegroundColor Green
Write-Host "4) (Optional Model app) set up Model deps and run python app.py" -ForegroundColor Green
