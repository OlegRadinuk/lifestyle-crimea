@echo off
chcp 65001 >nul
echo 🔍 Начинаю поиск JPG файлов во всех папках...
echo.

setlocal enabledelayedexpansion

REM Счетчики
set total=0
set success=0
set error=0

REM Проходим по всем JPG файлам рекурсивно
for /r %%f in (*.webp *.jpeg) do (
    set /a total+=1
    echo [%total%] Обрабатывается: %%~nxf
    echo    Папка: %%~dpf
    
    REM Конвертируем в WebP в той же папке
    cwebp -q 90 "%%f" -o "%%~dpnf.webp" 2>nul
    
    if exist "%%~dpnf.webp" (
        set /a success+=1
        echo    ✅ Создан: %%~pnxf.webp
        
        REM Показываем размер
        for %%s in ("%%f") do set jpg_size=%%~zs
        for %%s in ("%%~dpnf.webp") do set webp_size=%%~zs
        set /a compress=100 - (!webp_size! * 100 / !jpg_size!)
        echo    💾 Сжатие: !compress!%% (!jpg_size! → !webp_size! байт)
    ) else (
        set /a error+=1
        echo    ❌ Ошибка конвертации
    )
    echo.
)

echo ========================================
echo ✅ Готово!
echo 📊 Статистика:
echo    Всего файлов: %total%
echo    ✅ Успешно: %success%
echo    ❌ Ошибок: %error%
echo ========================================
pause