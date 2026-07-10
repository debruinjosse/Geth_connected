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

if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) {
  throw "Supabase CLI is not installed or not on PATH."
}

if (-not $env:SUPABASE_PROJECT_ID) {
  throw "SUPABASE_PROJECT_ID is missing."
}

if (-not $env:SUPABASE_DB_PASSWORD) {
  throw "SUPABASE_DB_PASSWORD is missing."
}

Push-Location $projectRoot
try {
  supabase link --project-ref $env:SUPABASE_PROJECT_ID --password $env:SUPABASE_DB_PASSWORD
  supabase db push
}
finally {
  Pop-Location
}
