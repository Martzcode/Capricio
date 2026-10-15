<#
.SYNOPSIS
  Empaquette l'executable Tauri en MSIX (Desktop Bridge), pret pour le Microsoft Store.

.DESCRIPTION
  - Met en scene l'exe + les Assets (logos) + AppxManifest.xml genere.
  - Package via MakeAppx.exe du Windows SDK (preinstalle sur les runners windows-latest).
  - Signature optionnelle via SignTool si un certificat PFX est fourni (sideload / GitHub).
    Pour une soumission Partner Center, le MSIX peut rester NON signe :
    le Store re-signe automatiquement le package pendant la certification.

  Normes Microsoft Store appliquees :
  - Version a 4 parties numeriques, chacune <= 65535 (ex. 2026.10.2.0).
  - Identity Name / Publisher parametrables : pour le Store, utiliser les valeurs
    du Partner Center (nom reserve + Publisher ID, ex. CN=...).
  - TargetDeviceFamily Windows.Desktop, capability runFullTrust (Desktop Bridge).
  - Convention de nommage : <Nom>_<Version>_<Arch>.msix

  Entrees (parametres ou variables d'environnement) :
    MSIX_IDENTITY_NAME  Defaut : Martzcode.Capricio (nom reserve Partner Center)
    MSIX_PUBLISHER      Defaut : CN=7D2188A8-E979-4CC7-B4CA-0B3ADA615D01 (Publisher ID Partner Center)
    MSIX_VERSION        Obligatoire, ex. 2026.10.2.0
    MSIX_SIGN_PFX_PATH  Chemin du certificat PFX (optionnel, pour signer)
    MSIX_SIGN_PASSWORD  Mot de passe du PFX (optionnel)
#>
[CmdletBinding()]
param(
  [string]$ExePath = "src-tauri/target/release/capricio.exe",
  [string]$ExecutableName = "Capricio.exe",
  [string]$OutputDir = "src-tauri/target/release/bundle/msix",
  [string]$AssetsDir = "src-tauri/icons",
  [string]$Architecture = "x64",
  [string]$DisplayName = "Capricio",
  [string]$PublisherDisplayName = "Martzcode",
  [string]$Description = "Capricio - Application d'aide a la decision"
)

$ErrorActionPreference = "Stop"

function Get-EnvOrDefault([string]$Name, [string]$Default) {
  $v = [Environment]::GetEnvironmentVariable($Name)
  if ([string]::IsNullOrWhiteSpace($v)) { return $Default }
  return $v.Trim()
}

$IdentityName = Get-EnvOrDefault "MSIX_IDENTITY_NAME" "Martzcode.Capricio"
$Publisher    = Get-EnvOrDefault "MSIX_PUBLISHER" "CN=7D2188A8-E979-4CC7-B4CA-0B3ADA615D01"
$Version      = Get-EnvOrDefault "MSIX_VERSION" ""
$SignPfx      = Get-EnvOrDefault "MSIX_SIGN_PFX_PATH" ""
$SignPassword = Get-EnvOrDefault "MSIX_SIGN_PASSWORD" ""

if ([string]::IsNullOrWhiteSpace($Version)) {
  throw "MSIX_VERSION n'est pas defini (attendu : A.B.C.D, ex. 2026.10.2.0)."
}
if ($Version -notmatch '^\d+\.\d+\.\d+\.\d+$') {
  throw "MSIX_VERSION invalide '$Version' : 4 parties numeriques requises (norme Store)."
}
foreach ($part in $Version.Split('.')) {
  if ([int]$part -gt 65535) {
    throw "MSIX_VERSION invalide '$Version' : chaque partie doit etre <= 65535 (norme Store)."
  }
}

if (-not (Test-Path $ExePath)) {
  $fallback = Get-ChildItem "src-tauri/target/release/*.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($fallback) {
    $ExePath = $fallback.FullName
    Write-Host "Exe detecte : $ExePath"
  } else {
    throw "Executable introuvable : $ExePath (lancez 'tauri build' d'abord)."
  }
}

$requiredAssets = @("Square44x44Logo.png", "Square150x150Logo.png", "StoreLogo.png")
foreach ($a in $requiredAssets) {
  $p = Join-Path $AssetsDir $a
  if (-not (Test-Path $p)) { throw "Asset MSIX manquant : $p" }
}

function Find-SdkTool([string]$FileName) {
  $sdkRoot = "C:\Program Files (x86)\Windows Kits\10\bin"
  if (Test-Path $sdkRoot) {
    $hit = Get-ChildItem $sdkRoot -Recurse -Filter $FileName -ErrorAction SilentlyContinue |
      Where-Object { $_.FullName -match '\\x64\\' } |
      Sort-Object FullName -Descending |
      Select-Object -First 1
    if ($hit) { return $hit.FullName }
  }
  $cmd = Get-Command $FileName -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  return $null
}

$makeappx = Find-SdkTool "makeappx.exe"
if (-not $makeappx) {
  throw "makeappx.exe introuvable : installez le Windows SDK (ex. 'winget install Microsoft.WindowsSDK')."
}
Write-Host "makeappx : $makeappx"

$stage = Join-Path ([IO.Path]::GetTempPath()) ("msix_stage_" + [Guid]::NewGuid().ToString("N"))
try {
  New-Item -ItemType Directory -Path $stage | Out-Null
  New-Item -ItemType Directory -Path (Join-Path $stage "Assets") | Out-Null
  Copy-Item $ExePath (Join-Path $stage $ExecutableName)
  foreach ($a in $requiredAssets) {
    Copy-Item (Join-Path $AssetsDir $a) (Join-Path $stage "Assets")
  }

  function Escape-Xml([string]$s) { return [System.Security.SecurityElement]::Escape($s) }
  $xName = Escape-Xml $IdentityName
  $xPub = Escape-Xml $Publisher
  $xDisplay = Escape-Xml $DisplayName
  $xPubDisplay = Escape-Xml $PublisherDisplayName
  $xDesc = Escape-Xml $Description

  # Style EntryPoint="Windows.FullTrustApplication" : compatible des que
  # MinVersion >= 10.0.17763.0 (pas besoin de uap10:RuntimeBehavior reserve a 19041+).
  $manifest = @"
<?xml version="1.0" encoding="utf-8"?>
<Package xmlns="http://schemas.microsoft.com/appx/manifest/foundation/windows10" xmlns:uap="http://schemas.microsoft.com/appx/manifest/uap/windows10" xmlns:rescap="http://schemas.microsoft.com/appx/manifest/foundation/windows10/restrictedcapabilities">
  <Identity Name="$xName" ProcessorArchitecture="$Architecture" Publisher="$xPub" Version="$Version" />
  <Properties>
    <DisplayName>$xDisplay</DisplayName>
    <PublisherDisplayName>$xPubDisplay</PublisherDisplayName>
    <Logo>Assets\StoreLogo.png</Logo>
    <Description>$xDesc</Description>
  </Properties>
  <Resources>
    <Resource Language="fr-FR" />
    <Resource Language="en-US" />
  </Resources>
  <Dependencies>
    <TargetDeviceFamily Name="Windows.Desktop" MinVersion="10.0.17763.0" MaxVersionTested="10.0.26100.0" />
  </Dependencies>
  <Capabilities>
    <rescap:Capability Name="runFullTrust" />
  </Capabilities>
  <Applications>
    <Application Id="App" Executable="$ExecutableName" EntryPoint="Windows.FullTrustApplication">
      <uap:VisualElements DisplayName="$xDisplay" Description="$xDesc" BackgroundColor="transparent" Square150x150Logo="Assets\Square150x150Logo.png" Square44x44Logo="Assets\Square44x44Logo.png" />
    </Application>
  </Applications>
</Package>
"@
  # TrimStart : le here-string @" impose un saut de ligne initial, or la
  # declaration <?xml doit etre au tout debut du fichier (exigence XML/MakeAppx).
  [IO.File]::WriteAllText((Join-Path $stage "AppxManifest.xml"), $manifest.TrimStart(), [Text.Encoding]::UTF8)

  New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
  $safeName = $DisplayName -replace '\s', ''
  $outMsix = Join-Path $OutputDir ("{0}_{1}_{2}.msix" -f $safeName, $Version, $Architecture)
  if (Test-Path $outMsix) { Remove-Item $outMsix -Force }

  & $makeappx pack /d $stage /p $outMsix /o
  if ($LASTEXITCODE -ne 0) { throw "makeappx a echoue (code $LASTEXITCODE)." }

  if (-not [string]::IsNullOrWhiteSpace($SignPfx)) {
    if (-not (Test-Path $SignPfx)) { throw "Certificat PFX introuvable : $SignPfx" }
    $signtool = Find-SdkTool "signtool.exe"
    if (-not $signtool) { throw "signtool.exe introuvable dans le Windows SDK." }
    if ([string]::IsNullOrWhiteSpace($SignPassword)) {
      & $signtool sign /fd SHA256 /a /f $SignPfx /tr http://timestamp.digicert.com /td SHA256 $outMsix
    } else {
      & $signtool sign /fd SHA256 /a /f $SignPfx /p $SignPassword /tr http://timestamp.digicert.com /td SHA256 $outMsix
    }
    if ($LASTEXITCODE -ne 0) { throw "signtool a echoue (code $LASTEXITCODE)." }
    Write-Host "MSIX signe : $outMsix"
  } else {
    Write-Host "::notice::MSIX non signe : pret pour Partner Center (le Store re-signe automatiquement)."
  }

  Write-Host "MSIX genere : $outMsix"
} finally {
  if (Test-Path $stage) { Remove-Item $stage -Recurse -Force }
}
