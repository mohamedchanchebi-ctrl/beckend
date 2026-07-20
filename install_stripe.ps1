$response = Invoke-RestMethod -Uri 'https://api.github.com/repos/stripe/stripe-cli/releases/latest'
$url = ($response.assets | Where-Object {$_.name -match 'windows_x86_64\.zip$'}).browser_download_url
Write-Output "Downloading from: $url"
Invoke-WebRequest -Uri $url -OutFile 'stripe.zip'
Expand-Archive -Path 'stripe.zip' -DestinationPath '.' -Force
Remove-Item 'stripe.zip'
.\stripe.exe --version
