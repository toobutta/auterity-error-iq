# Enterprise Security Hardening Checklist
# Place in docs or backend/config for reference and automation

SECURITY_HARDENING = [
    "Enforce strong authentication and authorization",
    "Apply automated security scanning (Bandit, Snyk)",
    "Harden network and API endpoints",
    "Encrypt sensitive data at rest and in transit",
    "Regularly update dependencies and patch vulnerabilities",
    "Audit access logs and monitor for suspicious activity",
]

if __name__ == "__main__":
    for item in SECURITY_HARDENING:
        print(f"[SECURITY] {item}")
