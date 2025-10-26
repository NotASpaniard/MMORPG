# PowerShell script to register commands and start bot
param(
    [switch]$SkipRegister
)

Write-Host "VIE Bot - Development Mode" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host ".env file not found!" -ForegroundColor Red
    Write-Host "Please create .env file with DISCORD_TOKEN, DISCORD_CLIENT_ID, DISCORD_GUILD_ID" -ForegroundColor Yellow
    exit 1
}

# Check if Guild ID is configured
$envContent = Get-Content ".env" -Raw
if ($envContent -notmatch "DISCORD_GUILD_ID=") {
    Write-Host "DISCORD_GUILD_ID not configured!" -ForegroundColor Red
    Write-Host "Please add DISCORD_GUILD_ID=1406714175555899512 to .env file" -ForegroundColor Yellow
    exit 1
}

# Register commands (unless skipped)
if (-not $SkipRegister) {
    Write-Host "Registering slash commands to guild..." -ForegroundColor Yellow
    Write-Host "This will take 3-5 seconds..." -ForegroundColor Yellow
    
    try {
        npm run register
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Commands registered successfully!" -ForegroundColor Green
        } else {
            Write-Host "Command registration failed!" -ForegroundColor Red
            Write-Host "You can skip registration with: npm run dev-skip" -ForegroundColor Yellow
            exit 1
        }
    } catch {
        Write-Host "Registration error: $_" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Skipping command registration..." -ForegroundColor Yellow
}

# Start bot
Write-Host "Starting bot..." -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan

# Kill any existing bot processes
$botProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*index.ts*" -or $_.CommandLine -like "*index.js*" }
if ($botProcesses) {
    Write-Host "Killing existing bot processes..." -ForegroundColor Yellow
    $botProcesses | Stop-Process -Force
    Start-Sleep -Seconds 2
}

# Remove lock file
if (Test-Path ".bot.lock") {
    Remove-Item ".bot.lock" -Force
    Write-Host "Removed .bot.lock file" -ForegroundColor Yellow
}

# Start bot with tsx watch
Write-Host "Starting bot with tsx watch..." -ForegroundColor Green
tsx watch index.ts
