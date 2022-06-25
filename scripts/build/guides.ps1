$OutDir = ".\website\out\guides"
$BuildDir = ".\guides\build\*"


Set-Location ./guides
npm run build
Set-Location ../


if (Test-Path $OutDir) {
    echo "Delete $OutDir"
    Remove-Item -Path $OutDir  -Recurse -Force
}


echo "Create $OutDir"
New-Item -Path $OutDir -ItemType "directory" 
Move-Item -Path $BuildDir -Destination $OutDir
