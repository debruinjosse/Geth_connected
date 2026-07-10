param(
  [Parameter(Position = 0)]
  [string]$Name = "auto_change"
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$migrationsDir = Join-Path $projectRoot "supabase\migrations"

if (-not (Test-Path $migrationsDir)) {
  New-Item -ItemType Directory -Path $migrationsDir | Out-Null
}

$existingMigrationFiles = Get-ChildItem $migrationsDir -Filter "*.sql" | Sort-Object Name
$nextNumber = 1

if ($existingMigrationFiles.Count -gt 0) {
  $lastMigration = $existingMigrationFiles[-1].BaseName
  if ($lastMigration -match '^(\d+)') {
    $nextNumber = [int]$matches[1] + 1
  }
}

$safeName = ($Name.ToLowerInvariant() -replace '[^a-z0-9]+', '_').Trim('_')
if ([string]::IsNullOrWhiteSpace($safeName)) {
  $safeName = "auto_change"
}

$migrationFileName = "{0:000}_{1}.sql" -f $nextNumber, $safeName
$migrationPath = Join-Path $migrationsDir $migrationFileName
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

$template = @"
-- Migration: $migrationFileName
-- Created automatically: $timestamp
-- Add schema changes below. Keep prior migration files unchanged.

begin;

-- SQL goes here

commit;
"@

Set-Content -LiteralPath $migrationPath -Value $template -Encoding UTF8
Write-Output $migrationPath
