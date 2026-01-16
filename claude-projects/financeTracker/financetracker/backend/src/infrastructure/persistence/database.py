"""
Database Setup with SQLAlchemy

Gère la création du moteur de base de données, les sessions,
et les opérations de vérification de santé.

Architecture:
- Utilise SQLite pour V1 (simple et sans serveur)
- Session factory pour gérer les lifecycles
- Health check pour vérifier la connexion
- Migrationsvia Alembic
"""
from __future__ import annotations

from typing import Generator
from contextlib import contextmanager
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.exc import SQLAlchemyError
import logging

logger = logging.getLogger(__name__)


class DatabaseConfig:
    """Configuration de la base de données."""

    def __init__(self, database_url: str = "sqlite:///./data/finance.db", echo: bool = False):
        """
        Initialize database configuration.

        Args:
            database_url: Database URL (e.g., sqlite:///./data/finance.db)
            echo: Log SQL statements if True
        """
        self.database_url = database_url
        self.echo = echo


class Database:
    """Gère la connexion et les sessions SQLAlchemy."""

    def __init__(self, config: DatabaseConfig):
        """
        Initialize database manager.

        Args:
            config: DatabaseConfig instance
        """
        self.config = config
        self.engine = self._create_engine()
        self.SessionLocal = sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=self.engine
        )

    def _create_engine(self):
        """
        Crée le moteur SQLAlchemy avec configuration appropriée.

        Returns:
            SQLAlchemy engine
        """
        # Pour SQLite, désactiver la contrainte de clé étrangère par défaut
        connect_args = {}

        if self.config.database_url.startswith("sqlite"):
            connect_args = {
                "check_same_thread": False,  # Permettre l'accès multi-thread
                "timeout": 30.0,  # Timeout de 30 secondes
            }

        engine = create_engine(
            self.config.database_url,
            connect_args=connect_args,
            echo=self.config.echo,
        )

        return engine

    def get_session(self) -> Session:
        """
        Retourne une nouvelle session SQLAlchemy.

        Returns:
            SQLAlchemy Session

        Examples:
            >>> db = Database(DatabaseConfig())
            >>> session = db.get_session()
            >>> # Utiliser la session
            >>> session.close()
        """
        return self.SessionLocal()

    @contextmanager
    def get_session_context(self) -> Generator[Session, None, None]:
        """
        Context manager pour les sessions (meilleur pour try/finally).

        Yields:
            SQLAlchemy Session

        Examples:
            >>> db = Database(DatabaseConfig())
            >>> with db.get_session_context() as session:
            ...     # Utiliser la session
            ...     pass  # Auto-cleanup
        """
        session = self.get_session()
        try:
            yield session
            session.commit()
        except Exception as e:
            session.rollback()
            logger.error(f"Database error: {e}")
            raise
        finally:
            session.close()

    def check_connection(self) -> bool:
        """
        Vérifie que la connexion à la base de données fonctionne.

        Returns:
            True si la connexion est OK, False sinon

        Examples:
            >>> db = Database(DatabaseConfig())
            >>> db.check_connection()
            True
        """
        try:
            with self.engine.connect() as connection:
                connection.execute(text("SELECT 1"))
                logger.info("Database connection OK")
                return True
        except SQLAlchemyError as e:
            logger.error(f"Database connection failed: {e}")
            return False

    def create_all_tables(self, base) -> None:
        """
        Crée toutes les tables à partir des modèles SQLAlchemy.

        Note: À utiliser uniquement pour le développement/tests.
        Pour la production, utiliser Alembic pour les migrations.

        Args:
            base: SQLAlchemy declarative_base
        """
        try:
            base.metadata.create_all(bind=self.engine)
            logger.info("All tables created successfully")
        except SQLAlchemyError as e:
            logger.error(f"Error creating tables: {e}")
            raise

    def drop_all_tables(self, base) -> None:
        """
        Supprime toutes les tables (DANGER - dev only).

        Args:
            base: SQLAlchemy declarative_base
        """
        try:
            base.metadata.drop_all(bind=self.engine)
            logger.warning("All tables dropped")
        except SQLAlchemyError as e:
            logger.error(f"Error dropping tables: {e}")
            raise

    def get_table_names(self) -> list[str]:
        """
        Retourne la liste des noms de tables dans la base de données.

        Returns:
            List of table names

        Examples:
            >>> db = Database(DatabaseConfig())
            >>> tables = db.get_table_names()
            >>> print(tables)
            ['transactions', 'accounts', 'categories', ...]
        """
        inspector = inspect(self.engine)
        return inspector.get_table_names()

    def close(self) -> None:
        """Ferme le pool de connexions."""
        self.engine.dispose()
        logger.info("Database connections closed")


# Global instance (singleton pattern)
_db_instance: Database | None = None


def initialize_database(config: DatabaseConfig) -> Database:
    """
    Initialize the global database instance.

    Args:
        config: DatabaseConfig instance

    Returns:
        Database instance

    Examples:
        >>> config = DatabaseConfig("sqlite:///./data/finance.db")
        >>> db = initialize_database(config)
        >>> db.check_connection()
        True
    """
    global _db_instance
    if _db_instance is None:
        _db_instance = Database(config)
    return _db_instance


def get_database() -> Database:
    """
    Get the global database instance.

    Returns:
        Database instance

    Raises:
        RuntimeError: If database not initialized
    """
    if _db_instance is None:
        raise RuntimeError("Database not initialized. Call initialize_database() first.")
    return _db_instance


def get_session_local() -> Generator[Session, None, None]:
    """
    FastAPI dependency for getting a database session.

    Yields:
        SQLAlchemy Session

    Examples:
        >>> @app.get("/items")
        ... async def read_items(session: Session = Depends(get_session_local)):
        ...     return session.query(Item).all()
    """
    db = get_database()
    with db.get_session_context() as session:
        yield session
