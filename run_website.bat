@echo off
title LeadFlow AI Platform (v3.0)
color 0A

echo ====================================================================
echo   Starting LeadFlow AI - Enterprise Intelligence Platform
echo ====================================================================
echo.

cd /d "%~dp0"
set "PORT=5261"

REM ----------------------------------------------------------------------------
REM 0. Verify that .env exists, or auto-generate .env and .env.example
REM ----------------------------------------------------------------------------
if not exist ".env.example" (
    (
        echo # ===========================================================================
        echo # LeadFlow AI - Environment Configuration Template
        echo # ===========================================================================
        echo.
        echo # 1. Server Port
        echo PORT=5261
        echo.
        echo # 2. Conda Environment Name ^(Optional^)
        echo CONDA_ENV_NAME=leadflow-ai
        echo.
        echo # 3. Google Gemini API Key ^(Required for live AI card scanning ^& OCR^)
        echo # Get a free key from: https://aistudio.google.com/
        echo GEMINI_API_KEY=
        echo.
        echo # 4. Gmail SMTP Settings ^(Optional - For real email dispatch^)
        echo SMTP_SERVER=smtp.gmail.com
        echo SMTP_PORT=587
        echo SMTP_USER=your_email@gmail.com
        echo SMTP_PASSWORD=your_app_password
        echo.
        echo # 5. Hunter.io API Key ^(Optional - B2B Email Deliverability^)
        echo # Get a free key from: https://hunter.io/
        echo HUNTER_API_KEY=
        echo.
        echo # 6. SerpAPI Key ^(Optional - LinkedIn OSINT Search Verification^)
        echo # Get a free key from: https://serpapi.com/
        echo SERPAPI_API_KEY=
        echo.
        echo # 7. Flask Runtime Environment
        echo FLASK_ENV=production
    ) > ".env.example"
    echo [INFO] Auto-generated .env.example template.
)

if not exist ".env" (
    copy ".env.example" ".env" >nul
    echo [INFO] Created .env configuration file.
    echo [NOTE] Open .env in Notepad to add your Gemini API Key:
    echo        GEMINI_API_KEY=your_actual_gemini_api_key_here
    echo        ^(Get a free key from https://aistudio.google.com/^)
    echo.
)

REM ----------------------------------------------------------------------------
REM 1. Prompt User to Choose Environment Type: Conda or Standard .venv
REM ----------------------------------------------------------------------------
echo ====================================================================
echo   Environment Selection
echo ====================================================================
echo   [1] Conda Environment (Create or use custom-named Conda env)
echo   [2] Standard Virtual Environment (.venv)
echo   [3] Exit
echo.
set "ENV_CHOICE="
set /p "ENV_CHOICE=Select environment mode [1, 2, or 3] (Default: 1): "
if "%ENV_CHOICE%"=="" set "ENV_CHOICE=1"
if "%ENV_CHOICE%"=="1" goto SETUP_CONDA
if "%ENV_CHOICE%"=="2" goto SETUP_VENV
if "%ENV_CHOICE%"=="3" exit /b 0

echo [WARNING] Invalid selection. Defaulting to Conda Environment.
goto SETUP_CONDA

REM ============================================================================
REM CONDA WORKFLOW
REM ============================================================================
:SETUP_CONDA
echo.
echo [INFO] Detecting Conda on your system...

REM Check if conda command exists in PATH
where.exe conda >nul 2>&1
if not errorlevel 1 goto CONDA_READY

REM Check common conda installation locations
if exist "%USERPROFILE%\anaconda3\Scripts\activate.bat" (
    call "%USERPROFILE%\anaconda3\Scripts\activate.bat" >nul 2>&1
    goto CONDA_READY
)
if exist "%USERPROFILE%\miniconda3\Scripts\activate.bat" (
    call "%USERPROFILE%\miniconda3\Scripts\activate.bat" >nul 2>&1
    goto CONDA_READY
)
if exist "%ProgramData%\Anaconda3\Scripts\activate.bat" (
    call "%ProgramData%\Anaconda3\Scripts\activate.bat" >nul 2>&1
    goto CONDA_READY
)
if exist "%ProgramData%\miniconda3\Scripts\activate.bat" (
    call "%ProgramData%\miniconda3\Scripts\activate.bat" >nul 2>&1
    goto CONDA_READY
)
if exist "%LocalAppData%\anaconda3\Scripts\activate.bat" (
    call "%LocalAppData%\anaconda3\Scripts\activate.bat" >nul 2>&1
    goto CONDA_READY
)
if exist "%LocalAppData%\miniconda3\Scripts\activate.bat" (
    call "%LocalAppData%\miniconda3\Scripts\activate.bat" >nul 2>&1
    goto CONDA_READY
)

echo.
echo ====================================================================
echo   [ERROR] Conda was not found on your system PATH or standard folders.
echo ====================================================================
echo   Make sure Anaconda or Miniconda is installed.
echo.
echo   [1] Switch to standard Python virtual environment (.venv)
echo   [2] Exit
echo.
set "CONDA_FALLBACK="
set /p "CONDA_FALLBACK=Enter choice [1 or 2] (Default: 1): "
if "%CONDA_FALLBACK%"=="" set "CONDA_FALLBACK=1"
if "%CONDA_FALLBACK%"=="1" goto SETUP_VENV
exit /b 1

:CONDA_READY
REM Determine default conda environment name (from .env if present, else 'leadflow-ai')
set "DEFAULT_CONDA_ENV=leadflow-ai"
if exist ".env" (
    for /f "tokens=1,* delims==" %%A in ('findstr /i "^CONDA_ENV_NAME=" .env 2^>nul') do (
        if not "%%B"=="" set "DEFAULT_CONDA_ENV=%%B"
    )
)

echo.
echo --------------------------------------------------------------------
echo   Conda Environment Configuration
echo --------------------------------------------------------------------
set "USER_ENV_NAME="
set /p "USER_ENV_NAME=Enter Conda environment name [Default: %DEFAULT_CONDA_ENV%]: "
if "%USER_ENV_NAME%"=="" set "USER_ENV_NAME=%DEFAULT_CONDA_ENV%"
set "CONDA_ENV_NAME=%USER_ENV_NAME%"

echo.
echo [INFO] Checking if Conda environment '%CONDA_ENV_NAME%' exists...
call conda run -n %CONDA_ENV_NAME% python -c "import sys" >nul 2>&1
if not errorlevel 1 (
    echo [OK] Found existing Conda environment: %CONDA_ENV_NAME%
    goto INSTALL_CONDA_DEPS
)

echo [INFO] Conda environment '%CONDA_ENV_NAME%' does not exist.
echo [SETUP] Creating Conda environment '%CONDA_ENV_NAME%' with Python 3.11...
call conda create -n %CONDA_ENV_NAME% python=3.11 -y
if errorlevel 1 (
    echo.
    echo [ERROR] Failed to create Conda environment '%CONDA_ENV_NAME%'.
    pause
    exit /b 1
)
echo [OK] Conda environment '%CONDA_ENV_NAME%' created successfully.

:INSTALL_CONDA_DEPS
echo.
echo [SETUP] Verifying and installing required packages in Conda (%CONDA_ENV_NAME%)...
if exist "requirements.txt" (
    call conda run -n %CONDA_ENV_NAME% pip install -r requirements.txt --quiet
)

set "PORT=5261"
set "HOST=0.0.0.0"
call conda activate %CONDA_ENV_NAME%

REM Dynamically detect local network IP
set "NETWORK_IP=localhost"
for /f %%I in ('python -c "import socket; s=socket.socket(socket.AF_INET, socket.SOCK_DGRAM); s.connect(('8.8.8.8',80)); print(s.getsockname()[0]); s.close()" 2^>nul') do set "NETWORK_IP=%%I"

echo.
echo ====================================================================
echo   [OK] Launching LeadFlow AI Dashboard on Port %PORT%
echo ====================================================================
echo.
echo Details:
echo  - Environment: Conda (%CONDA_ENV_NAME%)
echo  - Local URL:   http://localhost:%PORT%
echo  - Network URL: http://%NETWORK_IP%:%PORT%
echo  - Press CTRL+C in this window to stop the server.
echo.

python app.py

pause
exit /b 0

REM ============================================================================
REM STANDARD VENV WORKFLOW
REM ============================================================================
:SETUP_VENV
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

set "PORT=5261"
set "HOST=0.0.0.0"

REM Dynamically detect local network IP
set "NETWORK_IP=localhost"
for /f %%I in ('".venv\Scripts\python.exe" -c "import socket; s=socket.socket(socket.AF_INET, socket.SOCK_DGRAM); s.connect(('8.8.8.8',80)); print(s.getsockname()[0]); s.close()" 2^>nul') do set "NETWORK_IP=%%I"

echo.
echo ====================================================================
echo   [OK] Launching LeadFlow AI Dashboard on Port %PORT%
echo ====================================================================
echo.
echo Details:
echo  - Environment: Standard Virtual Environment (.venv)
echo  - Local URL:   http://localhost:%PORT%
echo  - Network URL: http://%NETWORK_IP%:%PORT%
echo  - Press CTRL+C in this window to stop the server.
echo.

".venv\Scripts\python.exe" app.py

pause
exit /b 0
