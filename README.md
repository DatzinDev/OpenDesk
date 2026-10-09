# OpenDesk

Plataforma open source de gestión de tickets para equipos de atención a clientes. Software de la familia [Datzin](https://datzin.com.mx).

## Ejecución

Requiere Docker.

```bash
cp .env.example .env   # completa las credenciales
docker compose up -d --build
```

La aplicación queda disponible en `http://localhost:8080`. En el cliente OAuth de Google Cloud registra la URI de
redirección `http://localhost:8080/api/auth/callback`. La cuenta definida en `ADMIN_EMAIL` es el Admin principal.

Pruebas del backend:

```bash
docker compose exec api pytest -q
```

## Documentación

- [Requisitos](docs/requisitos/README.md)
- [Stack y arquitectura](docs/arquitectura.md)
- [Diseño](docs/diseno.md)
- [Bitácora de cambios](docs/bitacora.md)
