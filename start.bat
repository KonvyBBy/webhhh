@echo off
title LZT Market
cd /d "%~dp0"
echo Starting Website + Discord Bot...
echo.
start "LZT Bot" cmd /c "node login\bot.js"
npm run dev
