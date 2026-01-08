# Project Cleanup Script
# Cleans build cache and temporary files

Write-Host "Starting project cleanup..." -ForegroundColor Cyan

$cleaned = @()
$totalSize = 0

# Cleanup items list
$cleanupItems = @(
    @{Path='tsconfig.tsbuildinfo'; Type='File'; Description='TypeScript build cache'},
    @{Path='du'; Type='File'; Description='Accidentally created empty file'},
    @{Path='next-env.d.ts'; Type='File'; Description='Next.js type file (auto-regenerated)'},
    @{Path='.next'; Type='Directory'; Description='Next.js build cache'},
    @{Path='out'; Type='Directory'; Description='Next.js output directory'},
    @{Path='build'; Type='Directory'; Description='Build directory'},
    @{Path='.vercel'; Type='Directory'; Description='Vercel cache'}
)

foreach ($item in $cleanupItems) {
    $path = $item.Path
    if (Test-Path $path) {
        try {
            if ($item.Type -eq 'Directory') {
                $size = (Get-ChildItem $path -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
                Remove-Item $path -Recurse -Force -ErrorAction Stop
                $sizeMB = [math]::Round($size/1MB, 2)
                $cleaned += [PSCustomObject]@{Item=$path; Type='Directory'; Size="$sizeMB MB"; Description=$item.Description}
                $totalSize += $size
            } else {
                $size = (Get-Item $path -ErrorAction SilentlyContinue).Length
                Remove-Item $path -Force -ErrorAction Stop
                $sizeKB = [math]::Round($size/1KB, 2)
                $cleaned += [PSCustomObject]@{Item=$path; Type='File'; Size="$sizeKB KB"; Description=$item.Description}
                $totalSize += $size
            }
        } catch {
            Write-Host "Warning: Cannot delete $path - $_" -ForegroundColor Yellow
        }
    }
}

if ($cleaned.Count -gt 0) {
    Write-Host "`nCleaned items:" -ForegroundColor Green
    $cleaned | Format-Table -AutoSize
    $totalSizeMB = [math]::Round($totalSize/1MB, 2)
    Write-Host "Total space freed: $totalSizeMB MB" -ForegroundColor Green
} else {
    Write-Host "`nNo items found to clean." -ForegroundColor Yellow
}

Write-Host "`nCleanup completed!" -ForegroundColor Cyan
