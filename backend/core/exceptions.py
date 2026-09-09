import uuid
import datetime
from fastapi import Request, status
from fastapi.responses import JSONResponse

class AppException(Exception):
    def __init__(self, status_code: int, title: str, detail: str, error_type: str = "about:blank"):
        self.status_code = status_code
        self.title = title
        self.detail = detail
        self.error_type = error_type

class TenantNotFoundException(AppException):
    def __init__(self, tenant_id: str):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            title="Tenant Not Found",
            detail=f"Studio tenant '{tenant_id}' does not exist or has been disabled.",
            error_type="https://cinesynapse.studio/errors/tenant-not-found"
        )

class LikenessCapExceededException(AppException):
    def __init__(self, actor_id: str, requested_sec: float, remaining_sec: float):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            title="SAG-AFTRA Likeness Cap Exceeded",
            detail=f"Performer '{actor_id}' has {remaining_sec}s likeness remaining, but requested action requires {requested_sec}s.",
            error_type="https://cinesynapse.studio/errors/likeness-cap-exceeded"
        )

class SentryVerificationException(AppException):
    def __init__(self, sentry_category: str, reason: str):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            title=f"Micro-Sentry Violation: {sentry_category}",
            detail=reason,
            error_type=f"https://cinesynapse.studio/errors/sentry-{sentry_category.lower()}"
        )

class C2PAValidationException(AppException):
    def __init__(self, reason: str):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            title="C2PA Provenance Manifest Validation Failed",
            detail=reason,
            error_type="https://cinesynapse.studio/errors/c2pa-verification-failed"
        )

async def app_exception_handler(request: Request, exc: AppException):
    correlation_id = request.headers.get("x-correlation-id", f"req-{uuid.uuid4().hex[:8]}")
    tenant_id = getattr(request.state, "tenant_id", "paramount_pictures")
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "type": exc.error_type,
            "title": exc.title,
            "status": exc.status_code,
            "detail": exc.detail,
            "instance": request.url.path,
            "tenant_id": tenant_id,
            "correlation_id": correlation_id,
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }
    )

async def global_exception_handler(request: Request, exc: Exception):
    correlation_id = request.headers.get("x-correlation-id", f"req-{uuid.uuid4().hex[:8]}")
    tenant_id = getattr(request.state, "tenant_id", "paramount_pictures")
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "type": "https://cinesynapse.studio/errors/internal-server-error",
            "title": "Internal Server Error",
            "status": 500,
            "detail": "An unexpected error occurred. SRE incident has been logged.",
            "instance": request.url.path,
            "tenant_id": tenant_id,
            "correlation_id": correlation_id,
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }
    )
