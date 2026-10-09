"""Almacenamiento de archivos compatible con S3. El bucket es privado; los archivos se sirven a través del API."""
import logging

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

from app.core import config

log = logging.getLogger(__name__)
_client = None


def _s3():
    global _client
    if _client is None:
        _client = boto3.client(
            "s3", endpoint_url=config.S3_ENDPOINT, aws_access_key_id=config.S3_ACCESS_KEY,
            aws_secret_access_key=config.S3_SECRET_KEY, region_name="us-east-1",
            config=Config(s3={"addressing_style": "path"}, retries={"max_attempts": 3}),
        )
    return _client


def ensure_bucket() -> None:
    try:
        _s3().head_bucket(Bucket=config.S3_BUCKET)
    except ClientError:
        _s3().create_bucket(Bucket=config.S3_BUCKET)
    except Exception as exc:  # el API arranca aunque el almacenamiento no esté listo
        log.warning("Almacenamiento no disponible: %s", exc)


def put(key: str, data: bytes, content_type: str) -> None:
    _s3().put_object(Bucket=config.S3_BUCKET, Key=key, Body=data, ContentType=content_type)


def stream(key: str):
    """Cuerpo del objeto en bloques, para StreamingResponse."""
    return _s3().get_object(Bucket=config.S3_BUCKET, Key=key)["Body"].iter_chunks(64 * 1024)
