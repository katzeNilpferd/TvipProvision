from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from presentation.api.endpoint import statistics
from config import settings


app = FastAPI(title="TVIP Statistics Service")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(statistics.router)


if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host=settings.SERVICE_HOST, port=settings.SERVICE_PORT)
