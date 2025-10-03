@echo off
echo 🚀 Starting Urban Planning Platform...

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker and try again.
    pause
    exit /b 1
)

REM Check if .env files exist
if not exist "backend\.env" (
    echo ⚠️  Backend .env file not found. Creating from example...
    copy backend\env.example backend\.env
    echo 📝 Please edit backend\.env with your API keys
)

if not exist "frontend\.env.local" (
    echo ⚠️  Frontend .env.local file not found. Creating...
    echo VITE_MAPBOX_TOKEN=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw > frontend\.env.local
    echo 📝 Please edit frontend\.env.local with your Mapbox token
)

REM Build and start services
echo 🔨 Building and starting services...
docker-compose up --build -d

REM Wait for services to be ready
echo ⏳ Waiting for services to be ready...
timeout /t 10 /nobreak >nul

REM Check service health
echo 🏥 Checking service health...

REM Check backend
curl -f http://localhost:5000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend is healthy
) else (
    echo ❌ Backend health check failed
)

REM Check frontend
curl -f http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend is healthy
) else (
    echo ❌ Frontend health check failed
)

echo.
echo 🎉 Urban Planning Platform is ready!
echo.
echo 📊 Access the application:
echo    Frontend: http://localhost:3000
echo    Backend API: http://localhost:5000
echo    WebSocket: ws://localhost:5000/realtime
echo.
echo 📚 View logs:
echo    docker-compose logs -f
echo.
echo 🛑 Stop the platform:
echo    docker-compose down
echo.
pause
