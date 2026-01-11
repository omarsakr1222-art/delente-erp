# Script to split HTML file into separate JS files
# استخراج <script> blocks من HTML وحفظها في ملفات منفصلة

$htmlFile = "d:\delente-erp\index.html"
$outputDir = "d:\delente-erp\js\extracted"

# Create output directory
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

# Read HTML file
$htmlContent = [System.IO.File]::ReadAllText($htmlFile, [System.Text.Encoding]::UTF8)

# Extract all <script> tags
$scriptPattern = '<script[^>]*>([\s\S]*?)<\/script>'
$matches = [regex]::Matches($htmlContent, $scriptPattern)

Write-Host "📊 وجدت $($matches.Count) script blocks" -ForegroundColor Cyan

$scriptFiles = @()
$counter = 1

foreach ($match in $matches) {
    $scriptContent = $match.Groups[1].Value
    
    # Skip empty scripts
    if ([string]::IsNullOrWhiteSpace($scriptContent)) {
        continue
    }
    
    # Determine script type based on content
    $scriptType = "inline"
    if ($scriptContent -match 'function (addSale|updateSale|deleteSale)') { $scriptType = "crud" }
    elseif ($scriptContent -match 'function render(Dashboard|AllSales|Customers)') { $scriptType = "renderers" }
    elseif ($scriptContent -match 'firebase|Firebase') { $scriptType = "firebase" }
    elseif ($scriptContent -match 'AuthSystem|login|logout') { $scriptType = "auth" }
    elseif ($scriptContent -match 'window.state\s*=|CustomersService|SalesService') { $scriptType = "services" }
    elseif ($scriptContent -match 'UIController|showPage|showLoginPage') { $scriptType = "ui-controller" }
    
    # Create filename
    $fileName = "script-$counter-$scriptType.js"
    $filePath = Join-Path $outputDir $fileName
    
    # Save script content
    [System.IO.File]::WriteAllText($filePath, $scriptContent, [System.Text.Encoding]::UTF8)
    
    $size = ($scriptContent | Measure-Object -Character).Characters
    Write-Host "  ✓ $fileName ($size chars)" -ForegroundColor Green
    
    $scriptFiles += @{
        filename = $fileName
        type = $scriptType
        size = $size
        order = $counter
    }
    
    $counter++
}

# Save metadata
$metadata = @{
    totalScripts = $scriptFiles.Count
    timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    files = $scriptFiles
}

$metadataPath = Join-Path $outputDir "metadata.json"
$metadata | ConvertTo-Json -Depth 10 | Out-File -FilePath $metadataPath -Encoding UTF8

Write-Host "`n✅ تم استخراج جميع scripts في: $outputDir" -ForegroundColor Green
Write-Host "   عدد الملفات: $($scriptFiles.Count)" -ForegroundColor Yellow
}
