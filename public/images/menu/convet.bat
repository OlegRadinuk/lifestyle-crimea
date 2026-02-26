@echo off
echo 🔍 Ищу JPG файлы...
echo.

REM Конвертирует JPG в текущей папке
for %%f in (*.webp *.jpeg) do (
    echo Конвертирую: %%f
    cwebp -q 85 "%%f" -o "%%~nf.webp"
    if exist "%%~nf.webp" (
        echo ✅ Создан: %%~nf.webp
    ) else (
        echo ❌ Ошибка при конвертации %%f
    )
    echo.
)

echo ✅ Готово!
pause