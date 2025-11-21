@echo off
setlocal ENABLEDELAYEDEXPANSION
color 0A

REM ============================
REM   CONFIG DES CHEMINS
REM ============================
set "SRC_WASM=node_modules\@babylonjs\havok\lib\esm\HavokPhysics.wasm"
set "SRC_JS=node_modules\@babylonjs\havok\lib\esm\HavokPhysics_es.js"
set "DEST=node_modules\.vite\deps"

echo.
echo ================================
echo   Patch Havok WASM lance
echo ================================
echo.

REM ============================
REM  Vérifier/Créer le dossier .vite\deps
REM ============================
if not exist "%DEST%" (
    echo ⚠ Le dossier "%DEST%" n'existe pas.
    echo   → Vite ne l'a probablement pas encore genere.
    echo   → Creation du dossier...
    mkdir "%DEST%"
)

REM ============================
REM  Copie sécurisée des fichiers
REM ============================
call :safeCopy "%SRC_WASM%" "%DEST%"
call :safeCopy "%SRC_JS%" "%DEST%"

echo.
echo ✅ Patch Havok termine !
echo.

color 07
endlocal
exit /b 0


REM ============================
REM  Sous-routine safeCopy
REM ============================
:safeCopy
set "src=%~1"
set "dest=%~2"

echo → Copie de "%src%" vers "%dest%"

if not exist "%src%" (
    color 0C
    echo   ❌ ERREUR : Le fichier source n'existe pas :
    echo       %src%
    color 0A
    goto :eof
)

copy /Y "%src%" "%dest%" >nul

if errorlevel 1 (
    color 0C
    echo   ✘ La copie a echoué !
    color 0A
) else (
    echo   ✔ Copie avec succes !
)

goto :eof
