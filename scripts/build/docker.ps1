Import-Module -Name $PSScriptRoot\version.ps1
Import-Module -Name $PSScriptRoot\..\utils.ps1

docker build `
    --tag "riezler/vulpo_auth:latest" `
    --tag "riezler/vulpo_auth:$Env:VulpoAuthVersion" `
    --build-arg version=$Env:VulpoAuthVersion`
    .

Show-Notification -ToastTitle "Docker build done"
