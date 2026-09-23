# Arranca la API con Java 21 (evita el Oracle Java 17 del PATH de Windows).
$ErrorActionPreference = "Stop"

$candidates = @(
    $env:JAVA_HOME,
    "C:\Program Files\Microsoft\jdk-21.0.12.101-hotspot",
    "C:\Program Files\Java\jdk-21"
) | Where-Object { $_ }

$javaHome = $null
foreach ($c in $candidates) {
    $resolved = Get-Item $c -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($resolved -and (Test-Path (Join-Path $resolved.FullName "bin\java.exe"))) {
        $javaHome = $resolved.FullName
        break
    }
}

if (-not $javaHome) {
    Write-Error "No se encontro JDK 21. Instala Microsoft OpenJDK 21 o define JAVA_HOME."
}

$env:JAVA_HOME = $javaHome
$env:Path = "$javaHome\bin;$env:Path"

Write-Host "Usando JAVA_HOME=$env:JAVA_HOME"

if ($args.Count -eq 0) {
    & "$PSScriptRoot\mvnw.cmd" spring-boot:run
} else {
    & "$PSScriptRoot\mvnw.cmd" @args
}
