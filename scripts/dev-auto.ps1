param(
  [switch]$Clean,
  [switch]$PushMigrations,
  [switch]$NoDev
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot

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
