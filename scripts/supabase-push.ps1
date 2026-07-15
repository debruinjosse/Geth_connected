$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $projectRoot ".env.local"
$profilePhotosMigration = Join-Path $projectRoot "supabase\migrations\010_profile_photos_storage.sql"

# Keep the CLI from writing telemetry files outside the project workspace.
[System.Environment]::SetEnvironmentVariable("SUPABASE_TELEMETRY_DISABLED", "1", "Process")

function Invoke-SupabaseChecked {
  param(
    [string]$CommandPath,
    [string[]]$Arguments
  )

  & $CommandPath @Arguments
  if ($LASTEXITCODE -ne 0) {
    $safeArguments = for ($index = 0; $index -lt $Arguments.Length; $index++) {
      if ($index -gt 0 -and $Arguments[$index - 1] -in @("--password", "--access-token", "--token")) {
        "***"
      }
      else {
        $Arguments[$index]
      }
    }
    throw "Supabase CLI command failed with exit code ${LASTEXITCODE}: $CommandPath $($safeArguments -join ' ')"
  }
}

if (Test-Path $envFile) {
  Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*#' -or $_ -notmatch '=') {
      return
    }

    $name, $value = $_ -split '=', 2
    [System.Environment]::SetEnvironmentVariable($name.Trim(), $value.Trim(), "Process")
  }
}

$localSupabaseCli = Join-Path $projectRoot "node_modules\.bin\supabase.cmd"
$supabaseCommand = $null

if (Test-Path -LiteralPath $localSupabaseCli) {
  $supabaseCommand = $localSupabaseCli
}
elseif (Get-Command supabase -ErrorAction SilentlyContinue) {
  $supabaseCommand = "supabase"
}
else {
  throw "Supabase CLI is not installed. Run npm install first so node_modules\.bin\supabase.cmd exists."
}

if (-not $env:SUPABASE_PROJECT_ID -and $env:NEXT_PUBLIC_SUPABASE_URL -match '^https://([a-z0-9]+)\.supabase\.co') {
  [System.Environment]::SetEnvironmentVariable("SUPABASE_PROJECT_ID", $matches[1], "Process")
}

if (-not $env:SUPABASE_PROJECT_ID) {
  throw "SUPABASE_PROJECT_ID is missing."
}

if (-not $env:SUPABASE_DB_PASSWORD) {
  throw "SUPABASE_DB_PASSWORD is missing."
}

if (-not $env:SUPABASE_ACCESS_TOKEN) {
  Write-Warning "SUPABASE_ACCESS_TOKEN is missing. This is okay only if the Supabase CLI is already logged in on this machine."
}

Push-Location $projectRoot
try {
  if (Test-Path -LiteralPath $profilePhotosMigration) {
    Write-Host "Profile photo Storage bucket migration detected: profile-photos"
  }

  Invoke-SupabaseChecked $supabaseCommand @("link", "--project-ref", $env:SUPABASE_PROJECT_ID, "--password", $env:SUPABASE_DB_PASSWORD)
  Invoke-SupabaseChecked $supabaseCommand @("db", "push")
  Write-Host "Supabase migrations pushed. Storage buckets declared in migrations are now applied."
}
finally {
  Pop-Location
}
