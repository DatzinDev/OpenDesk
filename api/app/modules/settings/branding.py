"""Identidad pública; los recursos se decodifican antes de publicarse."""
from io import BytesIO
from typing import Literal
from uuid import UUID, uuid4

from PIL import Image, UnidentifiedImageError
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session

from app.modules.settings import service
from app.modules.settings.events import SettingsChanged
from app.modules.settings.models import Param
from app.shared import storage
from app.shared.events import publish

PRESETS = {
    "opendesk": ("#0b1d3a", "#ff8e3c", "#087f8c"),
    "blue": ("#174ea6", "#087e8b", "#bc5b17"),
    "green": ("#155e4b", "#bd6414", "#5943a8"),
    "violet": ("#553388", "#c55275", "#147d74"),
}
MAX_BYTES = 1024 * 1024


class BrandingIn(BaseModel):
    preset: Literal["opendesk", "blue", "green", "violet", "custom"] = "opendesk"
    primary: str = Field(default="#0b1d3a", pattern=r"^#[0-9a-fA-F]{6}$")
    accent: str = Field(default="#ff8e3c", pattern=r"^#[0-9a-fA-F]{6}$")
    secondary: str = Field(default="#087f8c", pattern=r"^#[0-9a-fA-F]{6}$")
    logo_id: UUID | None = None
    icon_id: UUID | None = None

    @field_validator("primary", "accent", "secondary")
    @classmethod
    def _lower(cls, value):
        return value.lower()


class Palette(BaseModel):
    preset: str
    primary: str
    accent: str
    secondary: str


class BrandingOut(BaseModel):
    org_name: str
    logo_url: str | None
    icon_url: str | None
    palette: Palette


def _param_key(asset_id: UUID) -> str:
    return f"asset:{asset_id.hex}"


def read(db: Session) -> BrandingOut:
    row = db.get(Param, "branding")
    config = BrandingIn.model_validate(row.value if row else {})
    primary, accent, secondary = PRESETS.get(config.preset, (config.primary, config.accent, config.secondary))
    url = lambda asset: f"/api/settings/branding/assets/{asset}" if asset else None
    return BrandingOut(org_name=service.get(db, "org_name"), logo_url=url(config.logo_id), icon_url=url(config.icon_id),
                       palette=Palette(preset=config.preset, primary=primary, accent=accent, secondary=secondary))


def save(db: Session, actor, config: BrandingIn) -> BrandingOut:
    if actor.role != "admin":
        raise service.Forbidden
    for asset_id in (config.logo_id, config.icon_id):
        if asset_id and not db.get(Param, _param_key(asset_id)):
            raise ValueError("El recurso de identidad no existe. Vuelve a subirlo.")
    row = db.get(Param, "branding") or Param(key="branding")
    old = row.value
    row.value, row.updated_by = config.model_dump(mode="json"), actor.id
    db.add(row)
    db.commit()
    publish(SettingsChanged(actor_id=actor.id, changes={"branding": [old, row.value]}))
    return read(db)


def upload(db: Session, actor, data: bytes) -> dict:
    if actor.role != "admin":
        raise service.Forbidden
    if not data or len(data) > MAX_BYTES:
        raise ValueError("La imagen debe pesar como máximo 1 MB.")
    try:
        with Image.open(BytesIO(data), formats=["PNG", "WEBP"]) as image:
            if not all(32 <= side <= 2048 for side in image.size) or getattr(image, "n_frames", 1) != 1:
                raise ValueError("Usa una imagen fija de entre 32 y 2048 px por lado.")
            image.load()
            output = BytesIO()
            image.convert("RGBA").save(output, format="WEBP", lossless=True)
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as exc:
        raise ValueError("Usa una imagen PNG o WebP válida.") from exc
    asset_id = uuid4()
    key = f"branding/{asset_id}.webp"
    storage.put(key, output.getvalue(), "image/webp")
    db.add(Param(key=_param_key(asset_id), value={"key": key}, updated_by=actor.id))
    db.commit()
    return {"id": str(asset_id), "url": f"/api/settings/branding/assets/{asset_id}"}


def asset(db: Session, asset_id: UUID):
    row = db.get(Param, _param_key(asset_id))
    return row.value["key"] if row else None
