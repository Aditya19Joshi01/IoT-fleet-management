$ErrorActionPreference = "Stop"

$BUCKET_NAME = "fleet-management-frontend-dev-eef1ac4d"
$DISTRIBUTION_ID = "E1XF7T26D7N68L"

Write-Host "1. Installing Frontend Dependencies..."
Set-Location "frontend"
npm install
if ($LASTEXITCODE -ne 0) { Write-Error "npm install failed"; exit 1 }

Write-Host "2. Building Frontend..."
npm run build
if ($LASTEXITCODE -ne 0) { Write-Error "npm run build failed"; exit 1 }
Set-Location ".."

Write-Host "3. Uploading to S3 ($BUCKET_NAME)..."
aws s3 sync "frontend/dist" "s3://$BUCKET_NAME" --delete
if ($LASTEXITCODE -ne 0) { Write-Error "S3 upload failed"; exit 1 }

Write-Host "4. Invalidating CloudFront Cache ($DISTRIBUTION_ID)..."
aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"
if ($LASTEXITCODE -ne 0) { Write-Error "CloudFront invalidation failed"; exit 1 }

Write-Host "Done! Frontend deployed."
Write-Host "Your website should be live at: https://d28vdsctfgddo.cloudfront.net"
