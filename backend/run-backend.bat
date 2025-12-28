@echo off
echo ========================================
echo Starting Spring Boot Backend
echo ========================================
echo.

cd /d "%~dp0"

REM Check if .env exists and load it
if exist ".env" (
    echo Loading environment variables from .env file...
    for /f "usebackq tokens=1,* delims==" %%i in (".env") do (
        set "%%i=%%j"
    )
    echo Environment variables loaded.
) else (
    echo WARNING: .env file not found!
    echo Please create backend\.env with DB_URL, DB_USER, DB_PASSWORD
    echo.
)

echo.
echo Starting Spring Boot application...
echo.

if exist "mvnw.cmd" (
    call mvnw.cmd spring-boot:run
) else (
    echo ERROR: mvnw.cmd not found!
    echo Please run this script from the backend directory.
    pause
    exit /b 1
)
