@echo off
for %%f in (*.webp) do cwebp -q 92 "%%f" -o "%%~nf.webp"
pause
