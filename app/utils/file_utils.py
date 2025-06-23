from pathlib import Path
from fastapi import Response, HTTPException


def ensure_directory_exists(path: Path):
    path.mkdir(parents=True, exist_ok=True)


def serve_file(path: Path) -> Response:
    if not path.exists():
        raise HTTPException(status_code=404)
    with open(path, "rb") as f:
        return Response(content=f.read(), media_type="application/xml")


def copy_default_file(src: Path, dst: Path):
    with open(src, "rb") as source, open(dst, "wb") as destination:
        destination.write(source.read())
