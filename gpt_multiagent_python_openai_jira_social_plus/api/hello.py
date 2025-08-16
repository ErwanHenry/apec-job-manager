from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def hello():
    return {"message": "🚀 Kaspa Community Tool API", "status": "working"}

@app.get("/test")
def test():
    return {"test": "success", "vercel": "deployed"}