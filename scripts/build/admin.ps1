Import-Module -Name $PSScriptRoot\version.ps1

Set-Location ./admin
npm run build
Set-Location ../