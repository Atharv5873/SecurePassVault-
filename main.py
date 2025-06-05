from fastapi import FastAPI
from routers import router

app = FastAPI(title="SecurePassVault API")

app.include_router(router)