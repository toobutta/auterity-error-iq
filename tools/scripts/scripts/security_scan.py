# Automated Security Scanning Script
# Uses Bandit for Python code security analysis

import subprocess
import sys


def run_bandit_scan(target_dir: str):
    print(f"Running Bandit security scan on {target_dir}...")
    result = subprocess.run(
        [sys.executable, "-m", "bandit", "-r", target_dir],
        capture_output=True,
        text=True,
    )
    print(result.stdout)
    if result.returncode != 0:
        print("Security issues found.")
    else:
        print("No major security issues detected.")


if __name__ == "__main__":
    run_bandit_scan("../backend")
