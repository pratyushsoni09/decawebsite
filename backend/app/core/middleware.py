import time
import logging
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("decacorpus_backend")

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        start_time = time.time()
        
        response = await call_next(request)
        
        process_time = (time.time() - start_time) * 1000
        formatted_process_time = f"{process_time:.2f}ms"
        
        response.headers["X-Process-Time"] = formatted_process_time
        
        logger.info(
            f"Method: {request.method} Path: {request.url.path} "
            f"Status: {response.status_code} Duration: {formatted_process_time}"
        )
        return response
