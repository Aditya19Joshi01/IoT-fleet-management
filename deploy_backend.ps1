$ErrorActionPreference = "Stop"

Write-Host "1. Cleaning up..."
if (Test-Path "backend/package") { Remove-Item -Recurse -Force "backend/package" }
if (Test-Path "backend/lambda_function.zip") { Remove-Item -Force "backend/lambda_function.zip" }

Write-Host "2. Installing dependencies..."
# Use --platform manylinux2014_x86_64 to ensure we get Linux binaries (Lambda is Linux, not Windows)
# --only-binary=:all: ensures we don't try to compile source packages locally
pip install -r backend/requirements.txt --target backend/package --upgrade --platform manylinux2014_x86_64 --only-binary=:all: --python-version 3.11

Write-Host "3. Copying application code..."
Copy-Item -Recurse "backend/app" "backend/package/app"

Write-Host "4. Zipping package..."
$currentDir = Get-Location
Set-Location "backend/package"
Compress-Archive -Path * -DestinationPath "../lambda_function.zip"
Set-Location $currentDir

Write-Host "5. Uploading to AWS Lambda..."
# Note: Ensure AWS CLI is configured and region is correct (eu-west-1)
aws lambda update-function-code --function-name fleet-management-api-dev --zip-file fileb://backend/lambda_function.zip --region eu-west-1

Write-Host "Done! Backend deployed."
