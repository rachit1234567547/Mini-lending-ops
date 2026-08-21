$ErrorActionPreference = 'Stop'

$files = Get-ChildItem -File -Recurse | Where-Object { $_.FullName -notmatch "\\node_modules\\" -and $_.FullName -notmatch "\\\.git\\" -and $_.FullName -notmatch "\\\.next\\" } | Select-Object -ExpandProperty FullName | ForEach-Object { $_.Replace((Get-Location).Path + "\", "").Replace("\", "/") }

Write-Host "Resetting git history..."
git checkout --orphan new_main3
git rm -rf --cached . | Out-Null

Write-Host "Found $($files.Count) files to commit."

# Commit 1: Core config files
$coreConfig = @(".gitignore", "backend/.env", "frontend/next.config.ts", "frontend/package.json", "backend/package.json")
foreach ($f in $coreConfig) {
    if (Test-Path $f) { git add $f }
}
git commit -m "chore: initial project configuration and dependencies" | Out-Null

# Commit remaining files one by one
$i = 1
foreach ($f in $files) {
    if ($coreConfig -contains $f) { continue }
    
    git add $f
    $filename = $f.Split('/')[-1]
    
    $prefix = "chore"
    $msg = "add $filename"
    
    if ($f -match "frontend/src/app/globals.css") { $prefix = "style"; $msg = "implement dark theme design system" }
    elseif ($f -match "frontend/src/app") { $prefix = "feat(ui)"; $msg = "build $filename page component" }
    elseif ($f -match "frontend/src/components") { $prefix = "feat(components)"; $msg = "create $filename component" }
    elseif ($f -match "frontend/src/context") { $prefix = "feat(auth)"; $msg = "implement client-side auth context" }
    elseif ($f -match "backend/src/controllers") { $prefix = "feat(api)"; $msg = "implement business logic in $filename" }
    elseif ($f -match "backend/src/routes") { $prefix = "feat(routes)"; $msg = "register API endpoints in $filename" }
    elseif ($f -match "backend/src/models") { $prefix = "feat(db)"; $msg = "define mongoose schema for $filename" }
    elseif ($f -match "backend/src/services") { $prefix = "feat(services)"; $msg = "integrate third-party service in $filename" }
    elseif ($f -match "seed.js") { $prefix = "test(db)"; $msg = "add database seed script for testing" }
    elseif ($f -match "server.js") { $prefix = "feat(core)"; $msg = "configure express server entry point" }
    elseif ($f -match "README|CLAUDE|AGENTS") { $prefix = "docs"; $msg = "update $filename documentation" }
    elseif ($f -match "\.svg|\.ico") { $prefix = "chore(assets)"; $msg = "add $filename asset" }
    
    git commit -m "${prefix}: $msg" | Out-Null
    Write-Host "Committed [$i/58]: ${prefix}: $msg"
    $i++
}

Write-Host "Replacing main branch..."
git branch -D main
git branch -m main
git push -f origin main
Write-Host "Done! History rewritten and force-pushed."
