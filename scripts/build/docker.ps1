Import-Module -Name $PSScriptRoot\version.ps1

echo "Version: $Env:VulpoAuthVersion"

docker build `
    --tag "riezler/vulpo_auth:latest" `
    --tag "riezler/vulpo_auth:$Env:VulpoAuthVersion" `
    .