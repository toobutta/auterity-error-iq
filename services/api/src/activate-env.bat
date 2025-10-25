@echo off
echo Activating Python virtual environment...
call .venv\Scripts\activate.bat
echo Virtual environment activated: %VIRTUAL_ENV%
echo Python version:
python --version
echo.
echo To deactivate, type: deactivate
cmd /k
