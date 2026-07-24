@echo off
echo ==================================================
echo   Excel Energy Database Setup ^& Migration Helper
echo ==================================================
echo.
set /p DB_USER="root "
if "%DB_USER%"=="" set DB_USER=root
set /p DB_PASS="Enter MySQL Password (press Enter if none): "
set /p DB_HOST="Enter MySQL Host (default: localhost): "
if "%DB_HOST%"=="" set DB_HOST=localhost
set /p DB_PORT="Enter MySQL Port (default: 3306): "
if "%DB_PORT%"=="" set DB_PORT=3306

set DB_URL=mysql://%DB_USER%:%DB_PASS%@%DB_HOST%:%DB_PORT%/excel_energy
echo.
echo Updating backend/.env with DATABASE_URL...
powershell -Command "(gc backend/.env) -replace 'DATABASE_URL=.*', 'DATABASE_URL=\"%DB_URL%\"' | Out-File -encoding ASCII backend/.env"

echo.
echo Running Prisma Database setup...
cd backend
call npx prisma db push
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Database setup failed! Please verify MySQL is running and your credentials are correct.
    pause
    exit /b %errorlevel%
)

echo.
echo Seeding initial roles and administrator accounts...
call npx prisma db seed
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Seeding failed!
    pause
    cd ..
    exit /b %errorlevel%
)

cd ..
echo.
echo ==================================================
echo   Database setup completed successfully!
echo   Administrator username: excel_admin
echo   Administrator password: adminpassword123
echo ==================================================
pause
