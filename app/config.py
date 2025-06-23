from pathlib import Path


class Settings:
    PROVISION_DIR = Path("/var/www/tvipstb.net/prov.mac")
    DEFAULT_FILE = PROVISION_DIR / "default" / "tvip_provision.xml"
    MAC_REGEX = r"([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})"


settings = Settings()
