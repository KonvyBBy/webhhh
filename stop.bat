@echo off
echo Stopping LZT Market + Bot...
taskkill /f /fi "WindowTitle eq LZT Bot" 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do taskkill /f /pid %%a 2>nul
echo Done.
pause
