from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from . import models
from .database import engine, Base
from .routes import router
from .logging_config import logger

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Shipment Service",
    description="Manages shipments and orders for the USA Logistics Tracking System (SOA)",
    version="1.0.0",
    docs_url="/docs",
    openapi_url="/openapi.json",
)

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"{request.method} {request.url.path}")
    response = await call_next(request)
    return response


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.url.path}: {exc}")
    return JSONResponse(status_code=500, content={"error": {"message": "Internal Server Error"}})


@app.get("/health")
def health():
    return {"status": "ok", "service": "shipment-service"}


app.include_router(router)
