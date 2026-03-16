from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.report_router import router as report_router
from config.settings import settings

app = FastAPI(title=settings.PROJECT_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(report_router)

@app.get("/api/health")
def health_check():
    return {"status": "fastapi running"}

@app.get("/")
def read_root():
    return {"message": f"{settings.PROJECT_NAME} API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=settings.PORT, reload=True)
