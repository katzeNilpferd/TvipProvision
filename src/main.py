from fastapi import FastAPI

from presentation.api.endpoints import (provision, devices_management)


app = FastAPI(title="TVIP Provisioning Service")


app.include_router(provision.router)
app.include_router(devices_management.router)


if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=8000)
