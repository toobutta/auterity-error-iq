@echo off
echo Installing pre-commit hooks...

REM Install pre-commit if not already installed
pip install pre-commit

REM Install the git hooks
pre-commit install

REM Install commit-msg hook for conventional commits
pre-commit install --hook-type commit-msg

echo Pre-commit hooks installed successfully!
echo Run 'pre-commit run --all-files' to test all hooks
