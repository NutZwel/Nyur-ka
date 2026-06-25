@echo off
cd /d "D:\Tugas\Music App"
call npx vite build > nul 2>&1
node fix-html.js > nul 2>&1
start "" /B "node_modules\electron\dist\electron.exe" "." --no-sandbox
exit
