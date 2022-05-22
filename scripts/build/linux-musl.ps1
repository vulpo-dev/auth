param([switch]$SkipAdmin)

if ($SkipAdmin -eq $false) {
    Import-Module -Name $PSScriptRoot\admin.ps1
} else {
    echo "Skip Admin"
}


$Env:SQLX_OFFLINE="true"
cross build --target x86_64-unknown-linux-musl