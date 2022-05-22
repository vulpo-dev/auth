Import-Module -Name $PSScriptRoot\version.ps1
Import-Module -Name $PSScriptRoot\..\utils.ps1

echo "Version: $Env:VulpoAuthVersion"

docker build `
    --tag "riezler/vulpo_auth:latest" `
    --tag "riezler/vulpo_auth:$Env:VulpoAuthVersion" `
    .

Show-Notification -ToastTitle "Docker Build Done"
