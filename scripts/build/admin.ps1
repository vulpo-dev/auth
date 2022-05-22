Set-Location ./admin
$Env:REACT_APP_VERSION=$Env:VulpoAuthVersion
npm run build
Set-Location ../