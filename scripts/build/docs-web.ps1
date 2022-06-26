
npx typedoc `
    ./packages/web/sdk/src/main.ts `
    ./packages/web/sdk-react/src/main.ts `
    ./packages/web/ui/src/main.ts `
    --readme ./packages/web/README.md `
    --name "Vulpo Auth" `
    --out ./website/out/docs/web `
    --theme vulpo

$DocsRoot = "$PSScriptRoot\..\..\website\out\docs\web"

Get-ChildItem "$DocsRoot\*.html" -Recurse | ForEach {
    (Get-Content $_) | ForEach  {$_ -Replace 'index.html', 'overview.html'} | Set-Content $_
}

Get-ChildItem "$DocsRoot\index.html" | ForEach {
    Rename-Item -Path $_ -NewName "overview.html"
}

