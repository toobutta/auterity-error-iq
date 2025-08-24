@echo off
echo Fixing Python Environment Inconsistencies...

REM Remove duplicate virtual environments
if exist .venv rmdir /s /q .venv
if exist venv rmdir /s /q venv
if exist env rmdir /s /q env

REM Update backend Python version to match system
cd backend
echo 3.11.9 > .python-version

REM Create clean virtual environment
python -m venv .venv
call .venv\Scripts\activate.bat

REM Upgrade pip and install requirements
python -m pip install --upgrade pip
pip install -r requirements.txt

echo Python environment fixed successfully!
echo Active Python: 
python --version
echo Virtual environment: %VIRTUAL_ENV%