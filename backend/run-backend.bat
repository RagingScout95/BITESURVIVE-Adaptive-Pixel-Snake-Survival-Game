@echo off
echo Starting Spring Boot Backend...
echo.
cd backend
if exist mvnw.cmd (
    echo Using Maven Wrapper...
    call mvnw.cmd spring-boot:run
) else (
    echo Maven Wrapper not found. Trying system Maven...
    mvn spring-boot:run
)
pause

