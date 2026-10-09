"""Carga seeds/dev.sql cuando DEV_SEED=true. Uso: python -m app.core.seed"""
import os
from pathlib import Path

from app.core.db import engine

if __name__ == "__main__" and os.environ.get("DEV_SEED", "").lower() == "true":
    sql = (Path(__file__).parents[2] / "seeds" / "dev.sql").read_text()
    # Cursor del driver sin parámetros: el SQL se ejecuta tal cual (un "%" en el texto no es un marcador).
    with engine.begin() as conn:
        conn.connection.cursor().execute(sql)
    print("Datos de prueba cargados (DEV_SEED=true).")
