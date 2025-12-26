@echo off
echo Starting Frontend Server on http://localhost:8000
echo.
echo Press Ctrl+C to stop the server
echo.
echo To enable debug mode, add ?debug=true to the URL
echo Example: http://localhost:8000?debug=true
echo.
python -m http.server 8000

