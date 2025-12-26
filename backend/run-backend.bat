@echo off
setlocal enabledelayedexpansion
echo Starting Spring Boot Backend...
echo.

REM Load environment variables from ".env" (not committed to git)
REM Format: KEY=value
if exist ".env" (
    echo Loading environment from backend\.env
    for /f "usebackq eol=# tokens=1,* delims==" %%A in (".env") do (
        if not "%%A"=="" set "%%A=%%B"
    )
) else (
    echo No backend\.env found (this is ok if you already set DB_URL/DB_USER/DB_PASSWORD in your system env).
)
echo.

if exist mvnw.cmd (
    echo Using Maven Wrapper...
    call mvnw.cmd spring-boot:run
) else (
    echo Maven Wrapper not found. Trying system Maven...
    mvn spring-boot:run
)
pause

