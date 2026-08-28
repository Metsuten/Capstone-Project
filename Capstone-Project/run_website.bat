@echo off
title LeadFlow AI Platform (v3.0)
color 0A

echo ====================================================================
echo   Starting LeadFlow AI - Enterprise Intelligence Platform
echo ====================================================================
echo.

cd /d "%~dp0"

REM ----------------------------------------------------------------------------
REM 0. Verify that .env exists, or copy from .env.example
REM ----------------------------------------------------------------------------
if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo [INFO] Created default .env from .env.example.
        echo [NOTE] To enable live AI vision OCR, edit .env to add your Gemini API Key:
        echo        GEMINI_API_KEY=your_actual_gemini_api_key_here
        echo        (Get a free key from https://aistudio.google.com/)
        echo.
    )
)

REM ----------------------------------------------------------------------------
REM 1. Verify if existing .venv works on this specific computer
REM ----------------------------------------------------------------------------
if not exist ".venv\Scripts\python.exe" goto DETECT_PYTHON

".venv\Scripts\python.exe" -c "import sys" >nul 2>&1
if errorlevel 1 goto REBUILD_VENV

echo [OK] Found working isolated environment (.venv).
goto INSTALL_DEPS

:REBUILD_VENV
echo [WARNING] Existing .venv was created on another PC or is invalid.
echo [INFO] Rebuilding virtual environment cleanly for your PC...
rmdir /s /q .venv >nul 2>&1

:DETECT_PYTHON
echo [INFO] Detecting Python on your system...
set "HOST_PY="

py -3 -c "import sys" >nul 2>&1
if not errorlevel 1 set HOST_PY=py -3 & goto DO_CREATE

python -c "import sys" >nul 2>&1
if not errorlevel 1 set HOST_PY=python & goto DO_CREATE

py -c "import sys" >nul 2>&1
if not errorlevel 1 set HOST_PY=py & goto DO_CREATE

if exist "%LocalAppData%\Programs\Python\Python313\python.exe" set "HOST_PY=%LocalAppData%\Programs\Python\Python313\python.exe" & goto DO_CREATE
if exist "%LocalAppData%\Programs\Python\Python312\python.exe" set "HOST_PY=%LocalAppData%\Programs\Python\Python312\python.exe" & goto DO_CREATE
if exist "%LocalAppData%\Programs\Python\Python311\python.exe" set "HOST_PY=%LocalAppData%\Programs\Python\Python311\python.exe" & goto DO_CREATE
if exist "%LocalAppData%\Programs\Python\Python310\python.exe" set "HOST_PY=%LocalAppData%\Programs\Python\Python310\python.exe" & goto DO_CREATE
if exist "%ProgramFiles%\Python313\python.exe" set "HOST_PY=%ProgramFiles%\Python313\python.exe" & goto DO_CREATE
if exist "%ProgramFiles%\Python312\python.exe" set "HOST_PY=%ProgramFiles%\Python312\python.exe" & goto DO_CREATE
if exist "%ProgramFiles%\Python311\python.exe" set "HOST_PY=%ProgramFiles%\Python311\python.exe" & goto DO_CREATE
if exist "%ProgramFiles%\Python310\python.exe" set "HOST_PY=%ProgramFiles%\Python310\python.exe" & goto DO_CREATE

REM ----------------------------------------------------------------------------
REM No Python found handler - Automated Assistant
REM ----------------------------------------------------------------------------
echo.
echo ====================================================================
echo   [NOTICE] Python 3.10+ was not found on this computer.
echo ====================================================================
echo   LeadFlow AI requires Python to run.
echo.

REM Check if Windows Package Manager (winget) is available
winget --version >nul 2>&1
if not errorlevel 1 (
    echo [1] Press 1 to Auto-Install Python 3.12 via Windows Package Manager (Recommended)
    echo [2] Press 2 to Open official Python.org download page in your browser
    echo [3] Press 3 to Exit
    echo.
    set /p "CHOICE=Enter your choice [1, 2, or 3]: "
    if "%CHOICE%"=="1" goto AUTO_INSTALL_WINGET
    if "%CHOICE%"=="2" goto OPEN_PYTHON_ORG
    exit /b 1
)

:OPEN_PYTHON_ORG
echo [INFO] Opening https://www.python.org/downloads/ in your browser...
start "" "https://www.python.org/downloads/"
echo.
echo ====================================================================
echo   INSTALLATION INSTRUCTIONS:
echo ====================================================================
echo   1. Download and run the Python installer from python.org
echo   2. CRITICAL: Check the box "Add python.exe to PATH" during install!
echo   3. Once installed, double-click run_website.bat again to launch!
echo ====================================================================
echo.
pause
exit /b 1

:AUTO_INSTALL_WINGET
echo.
echo [SETUP] Installing Python 3.12 via Windows Package Manager (Winget)...
echo This may take 1-2 minutes. Please wait...
winget install Python.Python.3.12 --accept-package-agreements --accept-source-agreements
if errorlevel 1 (
    echo [WARNING] Winget installation encountered an issue.
    goto OPEN_PYTHON_ORG
)
echo.
echo [OK] Python 3.12 has been installed!
echo [INFO] Refreshing system environment and continuing setup...
set "PATH=%LocalAppData%\Programs\Python\Python312;%LocalAppData%\Programs\Python\Python312\Scripts;%PATH%"
set "HOST_PY=%LocalAppData%\Programs\Python\Python312\python.exe"
if exist "%HOST_PY%" goto DO_CREATE

REM Fallback if installed in ProgramFiles
if exist "%ProgramFiles%\Python312\python.exe" (
    set "HOST_PY=%ProgramFiles%\Python312\python.exe"
    goto DO_CREATE
)

echo.
echo [INFO] Installation complete. Please close this window and double-click run_website.bat again.
pause
exit /b 0

REM ----------------------------------------------------------------------------
REM Create venv and launch
REM ----------------------------------------------------------------------------
:DO_CREATE
echo [SETUP] Initializing dedicated virtual environment (.venv) using %HOST_PY%...
%HOST_PY% -m venv .venv
if not exist ".venv\Scripts\python.exe" (
    echo.
    echo [ERROR] Failed to create .venv with %HOST_PY%.
    echo Please verify that Python is properly installed with venv support.
    echo.
    pause
    exit /b 1
)
echo [OK] Virtual environment created successfully.

:INSTALL_DEPS
echo.
echo [SETUP] Verifying and installing required packages in (.venv)...
if exist "requirements.txt" (
    ".venv\Scripts\python.exe" -m pip install -r requirements.txt --quiet
)

echo.
echo ====================================================================
echo   [OK] Launching LeadFlow AI Dashboard on http://localhost:5000
echo ====================================================================
echo.
echo Tips:
echo  - Opening your browser automatically to http://localhost:5000...
echo  - Press CTRL+C in this window to stop the server.
echo.

".venv\Scripts\python.exe" app.py

pause
