:: Nom de la variable
set "VAR_NAME=NODE_OPTIONS"
:: Valeur de la variable
set "VAR_VALUE=--max-old-space-size=4096"

:: Vérifie si la variable système existe
set "CHECK_VAR="
for /F "tokens=2*" %%A in ('reg query "HKCU\Environment" /v %VAR_NAME% 2^>nul') do (
    set "CHECK_VAR=%%B"
)

:: Si la variable n'existe pas, la créer
if "%CHECK_VAR%"=="" (
    echo La variable %VAR_NAME% n'existe pas. Création de la variable...
    setx %VAR_NAME% %VAR_VALUE%
) else (
    echo La variable %VAR_NAME% existe déjà avec la valeur %CHECK_VAR%.
)

:: Afficher la variable pour vérification
set %VAR_NAME%

$env:NODE_OPTIONS="--max-old-space-size=4096"

cd ..

npm run build:win

$env:NODE_OPTIONS="--max-old-space-size=512"

explorer ../dist

pause