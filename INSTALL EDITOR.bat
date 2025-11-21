@echo off
setlocal ENABLEDELAYEDEXPANSION

REM On se place dans le dossier du .bat
cd /d "%~dp0"

title LGM3D - Installation de l'editeur
color 0A

echo ============================================
echo   Lusine Game Maker - Installation Editeur
echo ============================================
echo.

REM --- Étape 1 : Installation des dépendances ---
call :step "Installation des dependances (npm install)" "npm install"

REM --- Étape 2 : Build des blocks ---
call :step "Building lgm3d-core-blocks" "npm run -w lgm3d-core-blocks build"
call :step "Building lgm3d-rigidbody-blocks" "npm run -w lgm3d-rigidbody-blocks build"

REM --- Étape 3 : Patch Havok WASM (.vite/deps) ---
if exist "FIX_HAVOK_WASM_ERROR.bat" (
    call :step "Patch Havok WASM" "call FIX_HAVOK_WASM_ERROR.bat"
) else (
    echo.
    echo [WARN] ⚠ FIX_HAVOK_WASM_ERROR.bat introuvable, patch ignore.
)

echo.
echo ============================================
echo   ✅ Installation terminee sans erreur !
echo ============================================
echo.

REM --- Proposition de lancer le serveur de dev ---
echo.
choice /M "Voulez-vous lancer l'editeur maintenant ?"
if errorlevel 2 goto end
if errorlevel 1 (
    echo.
    echo ▶ Lancement du serveur de dev...

    if exist "RUN DEV SERVER.bat" (
        call "RUN DEV SERVER.bat"
    ) else (
        echo [INFO] RUN DEV SERVER.bat introuvable. Fallback : npm run dev
        npm run dev
    )
)

goto end


REM =================================================
REM   Sous-routine :step (gestion d’erreur & affichage)
REM =================================================
:step
set "STEP_NAME=%~1"
set "STEP_CMD=%~2"

echo.
echo --------------------------------------------
echo [ETAPE] %STEP_NAME% ...
echo --------------------------------------------
echo.

REM Affiche la commande (debug)
echo >NUL %STEP_CMD%

REM Exécute la commande
call %STEP_CMD%
if errorlevel 1 goto error
goto :eof


REM =================================================
REM   Gestion d’erreur globale
REM =================================================
:error
color 0C
echo.
echo ############################################
echo   ❌ Une erreur s'est produite :
echo      %STEP_NAME%
echo ############################################
echo.
echo Consultez les messages ci-dessus pour plus de details.
echo.
pause
exit /b 1


REM =================================================
REM   Fin normale du script
REM =================================================
:end
echo.
color 07
echo Appuyez sur une touche pour fermer cette fenetre...
pause >nul
endlocal
exit /b 0
