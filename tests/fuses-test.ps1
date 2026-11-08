# Electron fuses on the packaged app (run `npm run pack` first): on a copy of release\win-unpacked,
# --inspect must not open a Node inspector, and a changed byte in app.asar must stop the app.
$repo = Split-Path -Parent $PSScriptRoot
$work = if ($env:PDF_DIVA_TEST_WORK) { $env:PDF_DIVA_TEST_WORK } else { Join-Path (Split-Path -Parent (Split-Path -Parent $repo)) 'scratch\pdf-diva\test-work' }
$src = Join-Path $repo 'release\win-unpacked'
$dst = Join-Path $work 'fuses-copy'
$failures = 0
function Check($name, $ok) {
    if (-not $ok) { $script:failures++ }
    Write-Output ("{0} {1}" -f ($(if ($ok) { 'OK  ' } else { 'FAIL' })), $name)
}

New-Item -ItemType Directory -Force $work | Out-Null
if (Test-Path -LiteralPath $dst) { Remove-Item -LiteralPath $dst -Recurse -Force }
Copy-Item -LiteralPath $src -Destination $dst -Recurse
$exe = Join-Path $dst 'PDF Diva.exe'
$stop = { Get-Process | Where-Object { $_.Path -eq $exe } | Stop-Process -Force; Start-Sleep -Seconds 2 }

# 1. RunAsNode off: with ELECTRON_RUN_AS_NODE the app must not run a script.
$marker = Join-Path $work 'runasnode.txt'
Remove-Item -LiteralPath $marker -ErrorAction SilentlyContinue
$env:ELECTRON_RUN_AS_NODE = '1'
Start-Process -FilePath $exe -ArgumentList '-e', "`"require('fs').writeFileSync('$($marker -replace '\\', '/')', 'ran')`"" | Out-Null
Remove-Item Env:ELECTRON_RUN_AS_NODE
Start-Sleep -Seconds 6
Check 'ELECTRON_RUN_AS_NODE ignored' (-not (Test-Path -LiteralPath $marker))
& $stop

# 2. --inspect must not open a Node inspector on 9229.
Start-Process -FilePath $exe -ArgumentList '--inspect=9229' | Out-Null
Start-Sleep -Seconds 6
Check '--inspect ignored (nothing on port 9229)' (-not (Get-NetTCPConnection -LocalPort 9229 -State Listen -ErrorAction SilentlyContinue))
& $stop

# 3. A changed byte inside app.asar (in the file data, past the header) must stop the app.
$asar = Join-Path $dst 'resources\app.asar'
$bytes = [IO.File]::ReadAllBytes($asar)
$i = $bytes.Length - 100
$bytes[$i] = $bytes[$i] -bxor 0x20
[IO.File]::WriteAllBytes($asar, $bytes)
Start-Process -FilePath $exe | Out-Null
Start-Sleep -Seconds 8
Check 'tampered app.asar: the app does not start' (-not (Get-Process | Where-Object { $_.Path -eq $exe }))
& $stop

Remove-Item -LiteralPath $dst -Recurse -Force
Write-Output $(if ($failures) { "$failures FAILED" } else { 'ALL OK' })
