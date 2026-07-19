param(
  [int]$PreferredPort = 3000,
  [int]$MaxPort = 3010
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot

function Test-PortAvailable {
  param([int]$Port)

  $listener = $null

  try {
    $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $Port)
    $listener.Start()
    return $true
  }
  catch {
    return $false
  }
  finally {
    if ($listener) {
      $listener.Stop()
    }
  }
}

function Get-FreePort {
  for ($port = $PreferredPort; $port -le $MaxPort; $port++) {
    if (Test-PortAvailable -Port $port) {
      return $port
    }
  }

  throw "No free port found between $PreferredPort and $MaxPort."
}

Push-Location $projectRoot
try {
  $nextCommand = Join-Path $projectRoot "node_modules\.bin\next.cmd"

  if (-not (Test-Path -LiteralPath $nextCommand)) {
    throw "Next.js binary was not found. Run npm install first."
  }

  $port = Get-FreePort
  if ($port -ne $PreferredPort) {
    Write-Host "Port $PreferredPort is in use. Starting production server on port $port instead."
  }

  & $nextCommand start -p $port
}
finally {
  Pop-Location
}
