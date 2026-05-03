from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.report_router import router as report_router
from routers.rag_router import router as rag_router, rag_service
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
app.include_router(rag_router)

@app.on_event("startup")
async def startup_event():
    """Trigger initial RAG sync on startup."""
    print("--- Triggering initial RAG sync on startup ---")
    import threading
    # Run in a separate thread to not block the main event loop startup
    threading.Thread(target=rag_service.sync_data, daemon=True).start()

@app.get("/api/health")
def health_check():
    return {"status": "fastapi running"}

@app.get("/")
def read_root():
    return {"message": f"{settings.PROJECT_NAME} API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=settings.PORT, reload=True)
