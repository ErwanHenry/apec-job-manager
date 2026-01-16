"""
Configuration de l'application via variables d'environnement.

Utilise pydantic-settings pour valider et typer les variables.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuration de l'application."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Database
    database_url: str = "sqlite:///./data/finance.db"

    # API
    debug: bool = False
    api_prefix: str = "/api/v1"

    # Security
    secret_key: str = "change-me-in-production"

    # Claude API (optionnel, pour catégorisation avancée)
    claude_api_key: str = ""

    # Alert settings
    default_alert_threshold: float = 0.0


# Instance globale
settings = Settings()
