# Ensure build directory exists
$buildDir = "build/classes"
New-Item -ItemType Directory -Force -Path $buildDir | Out-Null

# Compile Java files
Write-Output "Compiling Java files..."
$javaFiles = Get-ChildItem -Recurse -Filter *.java -Path "src/java" | ForEach-Object { $_.FullName }

if ($javaFiles.Count -eq 0) {
    Write-Error "No Java files found in src/java"
    exit 1
}

javac -d $buildDir $javaFiles
if ($LASTEXITCODE -ne 0) {
    Write-Error "javac failed"
    exit $LASTEXITCODE
}

# Path to TeaVM fat jar
$teavmJar = "cli-0.12.0-SNAPSHOT-all.jar"  # Or whatever your fat jar is named

if (-not (Test-Path $teavmJar)) {
    Write-Error "Missing $teavmJar (expected TeaVM fat jar)"
    exit 1
}

# Run TeaVM using the fat jar
Write-Output "⚙️  Transpiling with TeaVM..."
java -jar $teavmJar `
    --target javascript `
    --dir public `
    --main-class ai.ConnectAI `
    --class-path $buildDir

if ($LASTEXITCODE -ne 0) {
    Write-Error "TeaVM failed"
    exit $LASTEXITCODE
}

Write-Output "TeaVM output written to /public"
