from fastapi import FastAPI
from Routers import credentials_router,auth_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="SecurePassVault API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow React or any domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(credentials_router.router)