# Pull latest code and clean duplicate folders
Write-Host "🔄 Pulling latest code from GitHub..." -ForegroundColor Cyan

# Pull from main branch
git pull origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Pull successful!" -ForegroundColor Green
    
    Write-Host "🧹 Cleaning duplicate folders..." -ForegroundColor Yellow
    
    # Remove duplicate folders from root
    $foldersToRemove = @("config", "controllers", "middlewares", "models", "routes", "node_modules")
    foreach ($folder in $foldersToRemove) {
        if (Test-Path $folder) {
            Remove-Item -Recurse -Force $folder -ErrorAction SilentlyContinue
            Write-Host "   Removed: $folder" -ForegroundColor Gray
        }
    }
    
    # Remove duplicate files from root
    $filesToRemove = @("index.js", "package.json", "package-lock.json", ".gitignore")
    foreach ($file in $filesToRemove) {
        if (Test-Path $file) {
            Remove-Item -Force $file -ErrorAction SilentlyContinue
            Write-Host "   Removed: $file" -ForegroundColor Gray
        }
    }
    
    Write-Host "✅ Cleanup complete! Only backend folder remains." -ForegroundColor Green
    Write-Host "📁 Structure: workflow 1/backend/" -ForegroundColor Cyan
} else {
    Write-Host "❌ Pull failed! Check your connection or conflicts." -ForegroundColor Red
}
