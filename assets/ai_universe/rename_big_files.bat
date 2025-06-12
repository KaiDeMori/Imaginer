@echo off
REM Batch script to rename all big_XX.png files in the current folder to XX.png
for %%f in (big_*.png) do (
    set "filename=%%~nf"
    setlocal enabledelayedexpansion
    set "num=!filename:big_=!"
    ren "%%f" "!num!.png"
    endlocal
)
