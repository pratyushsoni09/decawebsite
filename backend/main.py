from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.core.config import settings
from app.core.middleware import RequestLoggingMiddleware

app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION, openapi_url=f"{settings.API_PREFIX}/openapi.json")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)
app.add_middleware(RequestLoggingMiddleware)
app.include_router(router, prefix=settings.API_PREFIX)


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy", "project": settings.PROJECT_NAME, "version": settings.VERSION}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
