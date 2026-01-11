Param(
    [Parameter(Mandatory=$true)][string]$dataToSign,
    [Parameter(Mandatory=$true)][string]$thumbprint
)

try {
    # Normalize thumbprint
    $thumbprint = ($thumbprint -replace '\s', '').ToUpper()

    # Find certificate in CurrentUser\My store
    $cert = Get-ChildItem -Path Cert:\CurrentUser\My | Where-Object { ($_.Thumbprint -replace '\s','').ToUpper() -eq $thumbprint } | Select-Object -First 1
    if (-not $cert) {
        Write-Error "Certificate with thumbprint $thumbprint not found in Cert:\CurrentUser\My"
        exit 2
    }

    # Ensure private key is available
    $privateKey = $cert.GetRSAPrivateKey()
    if (-not $privateKey) {
        Write-Error "Private key for certificate $thumbprint is not accessible. Ensure the token is connected and accessible to the current user."
        exit 3
    }

    # Convert input to bytes (UTF8) and sign using RSA+SHA256
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($dataToSign)
    $signatureBytes = $privateKey.SignData($bytes, [System.Security.Cryptography.HashAlgorithmName]::SHA256, [System.Security.Cryptography.RSASignaturePadding]::Pkcs1)

    $signatureBase64 = [Convert]::ToBase64String($signatureBytes)

    # Output only the base64 signature
    Write-Output $signatureBase64
    exit 0
} catch {
    Write-Error $_.Exception.Message
    exit 1
}