import os
from fastapi import FastAPI, Request
from app.services.provision import ProvisionService
from app.config import settings


app = FastAPI()

# Инициализация директории при старте
os.makedirs(settings.PROVISION_DIR / "default", exist_ok=True)


@app.get("/prov/tvip_provision.xml")
async def get_provisin(request: Request):
    return await ProvisionService.get_provision(request)
