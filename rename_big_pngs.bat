@echo off
REM Batch script to rename all 'big_XX.png' files to 'XX.png' recursively in ai_universe
REM This script is safe to run multiple times; it will skip files that already match the target name.

setlocal enabledelayedexpansion

REM Change directory to the ai_universe folder
cd /d "%~dp0assets\ai_universe"

REM For each subfolder in ai_universe
for /r %%D in (.) do (
    pushd "%%D" >nul 2>&1
    for %%F in (big_*.png) do (
        set "old_name=%%F"
        set "new_name=!old_name:big_=!"
        if not "!old_name!"=="!new_name!" (
            if exist "!old_name!" (
                if not exist "!new_name!" (
                    echo Renaming "!old_name!" to "!new_name!"
                    ren "!old_name!" "!new_name!"
                ) else (
                    echo Skipping "!old_name!" (target exists)
                )
            )
        )
    )
    popd >nul 2>&1
)

echo Done.
pause
