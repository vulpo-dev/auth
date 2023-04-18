Import-Module -Name $PSScriptRoot\version.ps1

Set-Location ./packages/email-templates
npm run build
Set-Location ../../
