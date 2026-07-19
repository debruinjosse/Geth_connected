param(
  [switch]$Clean,
  [switch]$PushMigrations,
  [switch]$NoDev
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot

function Get-ExistingNextDevProcess {
  $escapedProjectRoot = [regex]::Escape($projectRoot)

  Get-CimInstance Win32_Process |
    Where-Object {
      $_.ProcessId -ne $PID -and
      $_.CommandLine -match $escapedProjectRoot -and
      $_.CommandLine -match 'next' -and
      $_.CommandLine -match '\bdev\b'
    } |
    Select-Object -First 1
}

Push-Location $projectRoot
try {
  if ($Clean) {
    Write-Host "Cleaning Next.js cache..."
    powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "clean-next-cache.ps1")
  }

  if ($PushMigrations) {
    Write-Host "Pushing Supabase migrations..."
    try {
      powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "supabase-push.ps1")
    }
    catch {
      Write-Warning "Supabase migration push failed: $($_.Exception.Message)"
      Write-Warning "Dev server will still start. Fix Supabase CLI/env, then run npm run supabase:push."
    }
  }

  if (-not $NoDev) {
    $existingDevProcess = Get-ExistingNextDevProcess

    if ($existingDevProcess) {
      Write-Host "Next.js dev server is already running for this project."
      Write-Host "PID: $($existingDevProcess.ProcessId)"
      Write-Host "Stop it with: taskkill /PID $($existingDevProcess.ProcessId) /F"
      return
    }

    Write-Host "Starting Next.js dev server..."
    $nextCommand = Join-Path $projectRoot "node_modules\.bin\next.cmd"

    if (-not (Test-Path -LiteralPath $nextCommand)) {
      throw "Next.js binary was not found. Run npm install first."
    }

    & $nextCommand dev
  }
}
finally {
  Pop-Location
}
