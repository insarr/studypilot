@echo off
chcp 65001 >nul
title StudyPilot — Запуск проекта
echo ===================================================
echo   StudyPilot — AI-помощник для студентов
echo ===================================================
echo.

cd /d "%~dp0"

if not exist "backend\node_modules" (
    echo [1/3] Установка зависимостей backend...
    cd backend
    call npm install
    cd ..
)

if not exist "frontend\node_modules" (
    echo [2/3] Установка зависимостей frontend...
    cd frontend
    call npm install
    cd ..
)

if not exist "frontend\dist\index.html" (
    echo [2.5/3] Сборка frontend...
    cd frontend
    call npm run build
    cd ..
)

echo [3/3] Запуск сервера StudyPilot на http://localhost:4000 ...
start "" "http://localhost:4000"
cd backend
call npm start
pause
