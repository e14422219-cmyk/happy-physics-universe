@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Happy Physics Universe - http://localhost:5173
echo (close this window to stop the server)
start "" http://localhost:5173
where py >nul 2>nul && (py -m http.server 5173 & goto :eof)
python -m http.server 5173
