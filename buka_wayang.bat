@echo off
title Mayarupa - Virtual Hand-Tracked Puppetry
color 0E

:: Pastikan bekerja di folder direktori aplikasi Mayarupa
cd /d "%~dp0"

:: Hapus helper script sementara jika masih ada
if exist "organize_assets.js" del /f /q "organize_assets.js" >nul 2>nul

echo ========================================================
echo        MAYARUPA - VIRTUAL HAND-TRACKED PUPPETRY
echo                   by wardannugraha
echo ========================================================
echo.
echo Menyiapkan server lokal Mayarupa...
echo.

:: 1. Coba jalankan server lokal via Python jika tersedia
where python >nul 2>nul
if %errorlevel%==0 (
    echo [OK] Menjalankan local server via Python di http://localhost:8000 ...
    start "" http://localhost:8000
    python -m http.server 8000
    goto end
)

:: 2. Coba jalankan server lokal via Node.js / npx jika tersedia
where npx >nul 2>nul
if %errorlevel%==0 (
    echo [OK] Menjalankan local server via Node/npx di http://localhost:8000 ...
    start "" http://localhost:8000
    npx -y serve -l 8000
    goto end
)

:: 3. Jika tidak ada Python / Node, buka langsung index.html di browser
echo [INFO] Membuka index.html secara langsung di peramban web...
start "" "%~dp0index.html"

:end
