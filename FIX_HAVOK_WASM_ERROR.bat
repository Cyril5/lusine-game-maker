@echo off
set "source=node_modules\@babylonjs\havok\lib\esm\HavokPhysics.wasm"
set "source2=node_modules\@babylonjs\havok\lib\esm\HavokPhysics_es.js"
set "destination=node_modules\.vite\deps"

echo Copie en cours de HavokPhysics.wasm et HavokPhysics_es.js ...
copy /Y "%source%" "%destination%"
copy /Y "%source2%" "%destination%"

if errorlevel 1 (
    echo La copie a échoué.
) else (
    echo HavokPhysics.wasm OK!
)
