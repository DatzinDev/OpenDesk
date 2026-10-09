import os

APP_URL = os.environ.get("APP_URL", "http://localhost:8080").rstrip("/")
SECRET_KEY = os.environ.get("SECRET_KEY", "dev")
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite://")
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "").strip().lower()

GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET", "")

MAIL_HOST = os.environ.get("MAIL_HOST", "")
MAIL_PORT = int(os.environ.get("MAIL_PORT", "587"))
MAIL_USERNAME = os.environ.get("MAIL_USERNAME", "")
MAIL_PASSWORD = os.environ.get("MAIL_PASSWORD", "")
MAIL_FROM = os.environ.get("MAIL_FROM", "")
MAIL_FROM_NAME = os.environ.get("MAIL_FROM_NAME", "OpenDesk")
MAIL_USE_TLS = os.environ.get("MAIL_USE_TLS", "true").lower() == "true"

SECURE_COOKIES = APP_URL.startswith("https://")
