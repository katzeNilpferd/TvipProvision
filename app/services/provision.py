import re
from pathlib import Path
from fastapi import Request
from ..config import settings
from ..utils.file_utils import (
    ensure_directory_exists,
    serve_file,
    copy_default_file
)


class ProvisionService():

    @staticmethod
    async def get_provision(request: Request):
        mac_address = request.headers.get("Mac-Address")
        
        if not mac_address:
            return serve_file(settings.PROVISION_DIR)

        mac = mac_address.replace(":", "").replace("-", "").lower()
        mac_file = settings.PROVISION_DIR / mac / "tvip_provision.xml"

        if not mac_file.exists():
            ensure_directory_exists(mac_file.parent)
            copy_default_file(settings.DEFAULT_FILE, mac_file)
        
        return serve_file(mac_file)
