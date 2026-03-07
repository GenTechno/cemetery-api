@echo off
cd /d "%~dp0"

REM Start server in its own window
start "Cemetery Cloud Server" cmd /k node server.js

REM Wait for server to start
timeout /t 2 /nobreak >nul

REM Open the dashboard as an "app window"
start "" chrome --app=http://localhost:3000/dashboard.html