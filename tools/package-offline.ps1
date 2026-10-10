$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
Push-Location $projectRoot
try {
    node tools/build-offline.mjs
    if ($LASTEXITCODE -ne 0) { throw 'Offline build failed.' }
    $packageRoot = Join-Path $projectRoot 'dist/offline/toeic-offline'
    $zipPath = Join-Path $projectRoot 'dist/toeic-offline.zip'
    Compress-Archive -LiteralPath $packageRoot -DestinationPath $zipPath -CompressionLevel Optimal -Force
    $hash = (Get-FileHash -LiteralPath $zipPath -Algorithm SHA256).Hash.ToLowerInvariant()
    [System.IO.File]::WriteAllText("$zipPath.sha256", "$hash  toeic-offline.zip`n", [System.Text.Encoding]::ASCII)
    Write-Output "Package: $zipPath"
    Write-Output "SHA256: $hash"
} finally {
    Pop-Location
}
