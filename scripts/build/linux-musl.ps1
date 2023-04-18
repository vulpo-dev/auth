param([switch]$SkipAdmin)

Import-Module -Name $PSScriptRoot\version.ps1
Import-Module -Name $PSScriptRoot\..\utils.ps1


if ($SkipAdmin -eq $false) {
    Import-Module -Name $PSScriptRoot\admin.ps1
} else {
    echo "Skip Admin"
}

Import-Module -Name $PSScriptRoot\templates.ps1

$Env:SQLX_OFFLINE="true"
cross build --target x86_64-unknown-linux-musl --release

Show-Notification -ToastTitle "linux musl build done"