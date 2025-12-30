# PowerShell script to optimize HTML by removing comments and extra whitespace
param(
    [string]$inputFile = "d:\delente-erp\index.html",
    [string]$outputFile = "d:\delente-erp\index.html"
)

Write-Host "قراءة الملف..." -ForegroundColor Green
$content = Get-Content $inputFile -Raw -Encoding UTF8

# خطوة 1: إزالة تعليقات HTML الطويلة (مع الحفاظ على الأكواد بداخلها)
Write-Host "إزالة التعليقات..." -ForegroundColor Cyan
# Remove HTML comments but preserve code
$content = $content -replace '<!--[\s\S]*?-->', ''

# خطوة 2: إزالة المسافات الزائدة بين الأسطر (keep single space only)
Write-Host "تنظيف المسافات..." -ForegroundColor Cyan
$content = $content -replace '\s+\n', "`n"  # Remove trailing spaces
$content = $content -replace '\n\s+', "`n"  # Remove leading spaces
$content = $content -replace '\n{3,}', "`n`n"  # Replace multiple newlines with double

# خطوة 3: إزالة المسافات حول العلامات (مع الحذر)
Write-Host "تقليص HTML..." -ForegroundColor Cyan
$content = $content -replace '>\s+<', '><'  # Remove spaces between tags

# Save
Write-Host "حفظ الملف المُحسَّن..." -ForegroundColor Green
[System.IO.File]::WriteAllText($outputFile, $content, [System.Text.UTF8Encoding]::new($false))

$newSize = (Get-Item $outputFile | Measure-Object -Property Length -Sum).Sum
$oldSize = (Get-Content $inputFile -Raw -Encoding UTF8 | Measure-Object -Character).Characters

Write-Host "`n✅ تم تقليل الحجم:" -ForegroundColor Green
Write-Host "  الحجم القديم: $oldSize bytes" -ForegroundColor Yellow
Write-Host "  الحجم الجديد: $newSize bytes" -ForegroundColor Green
Write-Host "  تقليل: $(([math]::Round((1 - $newSize/$oldSize) * 100, 1)))%" -ForegroundColor Cyan
