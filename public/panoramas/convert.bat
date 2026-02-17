@echo off
for %%f in (*.jpg) do cwebp -q 92 "%%f" -o "%%~nf.webp"
pause
