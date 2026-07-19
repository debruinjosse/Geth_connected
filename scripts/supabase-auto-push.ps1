$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $projectRoot ".env.local"

if (Test-Path $envFile) {
  Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*#' -or $_ -notmatch '=') {
      return
    }

    $name, $value = $_ -split '=', 2
    [System.Environment]::SetEnvironmentVariable($name.Trim(), $value.Trim(), "Process")
  }
}

if (-not $env:SUPABASE_PROJECT_ID -and $env:NEXT_PUBLIC_SUPABASE_URL -match '^https://([a-z0-9]+)\.supabase\.co') {
  [System.Environment]::SetEnvironmentVariable("SUPABASE_PROJECT_ID", $matches[1], "Process")
}

if (-not $env:SUPABASE_PROJECT_ID -or -not $env:SUPABASE_DB_PASSWORD) {
  Write-Warning "Skipping automatic Supabase migration push because SUPABASE_PROJECT_ID or SUPABASE_DB_PASSWORD is missing."
  Write-Warning "Local dev still pushes automatically when these values exist in .env.local. Add them to Vercel only if you intentionally want builds to push DB migrations."
  exit 0
}

$previousErrorActionPreference = $ErrorActionPreference
$ErrorActionPreference = "Continue"
$output = & powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "supabase-push.ps1") 2>&1
$supabaseExitCode = $LASTEXITCODE
$ErrorActionPreference = $previousErrorActionPreference

if ($supabaseExitCode -ne 0) {
  Write-Warning "Automatic Supabase migration push failed, but build/start will continue."
  Write-Warning "Most likely causes: no internet access, Supabase API unavailable, missing/invalid SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_ID, or SUPABASE_DB_PASSWORD."
  Write-Warning "Relevant Supabase output:"
  $output | ForEach-Object {
    Write-Warning "  $_"
  }
  exit 0
}

$output | ForEach-Object {
  Write-Host $_
}
