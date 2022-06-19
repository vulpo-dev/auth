$CalVer = Get-Content -Path $PSScriptRoot\..\..\VERSION -First 1
$Env:VulpoAuthVersion = "$CalVer"

echo "Version: $Env:VulpoAuthVersion"