from fastapi import FastAPI
from Routers import credentials_router, auth_router, admin_router, utils_router, products_router, notes_router, api_keys_router
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
import httpx
from fastapi.responses import HTMLResponse


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
app.include_router(notes_router.router)
app.include_router(api_keys_router.router)

def ping_site():
    try:
        url = "https://securepass-vault.onrender.com/"
        response = httpx.get(url, timeout=10)
        print(f"Pinged {url} | Status : {response.status_code}")
    except Exception as e:
        print(f"Ping error: {e}")

scheduler = BackgroundScheduler()
scheduler.add_job(ping_site, 'interval', minutes=13)
scheduler.start()

@app.get("/", response_class=HTMLResponse)
def root():
    html_content = """
    <html>
        <head>
            <title>SecurePass Vault</title>
            <meta http-equiv="refresh" content="5;url=https://securepass-vault.onrender.com/vault" />
            <style>
                body {
                    background-color: #0f172a;
                    color: #f1f5f9;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    flex-direction: column;
                    text-align: center;
                }
                h1 {
                    font-size: 2.5rem;
                    margin-bottom: 1rem;
                    color: #38bdf8;
                }
                p {
                    font-size: 1.2rem;
                    color: #cbd5e1;
                }
                .loader {
                    margin-top: 20px;
                    border: 6px solid #1e293b;
                    border-top: 6px solid #38bdf8;
                    border-radius: 50%;
                    width: 50px;
                    height: 50px;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        </head>
        <body>
            <h1>🔐 SecurePass Vault</h1>
            <p>Redirecting to your vault in 5 seconds...</p>
            <div class="loader"></div>
        </body>
    </html>
    """
    return HTMLResponse(content=html_content, status_code=200)
