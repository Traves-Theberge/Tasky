Write-Host "Starting Tasky..." -ForegroundColor Green

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
}

# Build components
Write-Host "Building application..." -ForegroundColor Yellow
npm run build-renderer
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to build renderer" -ForegroundColor Red
    exit 1
}

npm run build-electron  
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to build electron modules" -ForegroundColor Red
    exit 1
}

# Start the application
Write-Host "Launching Tasky..." -ForegroundColor Green
npm run start