Import-Module -Name $PSScriptRoot\version.ps1

$Env:NEXT_PUBLIC_VERSION=$Env:VulpoAuthVersion

Set-Location ./website
npm run build
Set-Location ../

Import-Module -Name $PSScriptRoot\docs-web.ps1