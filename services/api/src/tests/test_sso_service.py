import jwt

from app.services.sso_service import SSOService


def test_parse_oidc_id_token_allows_unverified_decode(monkeypatch):
    class DummyDB:
        pass

    service = SSOService(db=DummyDB())

    payload = {
        "sub": "user@example.com",
        "email": "user@example.com",
        "name": "User",
    }
    token = jwt.encode(payload, "dummy", algorithm="HS256")

    decoded = service._parse_oidc_id_token(token)

    assert decoded["sub"] == "user@example.com"
    assert decoded["email"] == "user@example.com"

