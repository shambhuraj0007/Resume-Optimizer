$files = @("batch2.json", "batch3.json", "batch4.json", "batch5.json")
foreach ($f in $files) {
    Write-Host "=== $f ==="
    try {
        $content = Get-Content $f -Raw
        $null = $content | ConvertFrom-Json
        Write-Host "VALID JSON"
    } catch {
        Write-Host "INVALID: $($_.Exception.Message)"
    }
}
