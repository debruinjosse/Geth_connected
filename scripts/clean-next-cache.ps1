$ErrorActionPreference = "Stop"

$workspace = (Resolve-Path -LiteralPath ".").Path
$targetPath = Join-Path $workspace ".next"

if (-not (Test-Path -LiteralPath $targetPath)) {
  Write-Host "No .next cache found."
  exit 0
}

$resolvedTarget = (Resolve-Path -LiteralPath $targetPath).Path

if (-not $resolvedTarget.StartsWith($workspace, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "Refusing to remove .next outside workspace: $resolvedTarget"
}

Remove-Item -LiteralPath $resolvedTarget -Recurse -Force
Write-Host "Removed .next cache. Run npm run dev or npm run build again."
