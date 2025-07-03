from fastapi import FastAPI
from Routers import credentials_router,auth_router,admin_router,utils_router,products_router
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
import httpx

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
app.include_router(admin_router.router)
app.include_router(utils_router.router)
app.include_router(products_router.router)

def ping_site():
    try:
        url="https://securepass-vault.onrender.com/"
        response=httpx.get(url,timeout=10)
        print(f"Pinged {url} | Status : {response.status_code}")
    except Exception as e:
        print(f"Ping error: {e}")
        
scheduler=BackgroundScheduler()
scheduler.add_job(ping_site,'interval',minutes=13)
scheduler.start()

@app.get("/")
def root():
    return {"message":"SecurePass Vault is Running"}
