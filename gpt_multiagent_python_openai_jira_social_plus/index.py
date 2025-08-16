from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Kaspa Community Tool", version="0.3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "message": "🚀 Kaspa Community Tool API",
        "version": "0.3.0",
        "status": "operational",
        "platform": "vercel",
        "services": ["BlablaKAS", "KAScomodation"],
        "github": "https://github.com/ErwanHenry/kaspa-community-tool",
        "endpoints": {
            "health": "/health",
            "api_functions": "/api/"
        }
    }

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "kaspa-community-tool",
        "platform": "vercel"
    }

# Export for Vercel
from mangum import Mangum
handler = Mangum(app)