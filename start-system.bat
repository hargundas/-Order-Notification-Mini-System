@echo off
title Order Notification Mini-System (Backend + Tunnel)
echo ========================================================
echo   Starting Order Notification Mini-System
echo ========================================================
echo.

echo [1/2] Starting Spring Boot Backend (Java 21)...
start "Spring Boot Backend (Port 8080)" cmd /k "cd backend && .\mvnw.cmd spring-boot:run"

timeout /t 8 /nobreak >nul

echo [2/2] Starting Cloudflare Tunnel...
start "Cloudflare Live Tunnel" cmd /k ".\cftunnel.exe tunnel --protocol http2 --url http://localhost:8080"

echo.
echo ========================================================
echo   System Started Successfully!
echo   Frontend Live: https://testordersystem.web.app
echo ========================================================
pause
