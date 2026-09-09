from contextvars import ContextVar
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from backend.core.security import decode_tenant_jwt
from backend.core.logging import log_telemetry

current_tenant: ContextVar[str] = ContextVar("current_tenant", default="paramount_pictures")
current_user: ContextVar[str] = ContextVar("current_user", default="user-marcus-dp")
current_project: ContextVar[str] = ContextVar("current_project", default="")

class TenantContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Default fallback tenant for dev exploration
        tenant_id = "paramount_pictures"
        user_id = "marcus-dp"
        user_role = "director"

        # Check tenant and project headers or auth token
        tenant_header = request.headers.get("x-tenant-id")
        project_header = request.headers.get("x-project-id")
        auth_header = request.headers.get("Authorization")

        if tenant_header:
            tenant_id = tenant_header
        elif auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            try:
                payload = decode_tenant_jwt(token)
                tenant_id = payload.get("tenant_id", tenant_id)
                user_id = payload.get("sub", user_id)
                user_role = payload.get("role", user_role)
            except Exception:
                pass # Gracefully keep fallback in dev

        # Bind context
        current_tenant.set(tenant_id)
        current_user.set(user_id)
        current_project.set(project_header or "")
        request.state.tenant_id = tenant_id
        request.state.user_id = user_id
        request.state.user_role = user_role
        request.state.project_id = project_header

        response = await call_next(request)
        response.headers["x-tenant-id"] = tenant_id
        if project_header:
            response.headers["x-project-id"] = project_header
        return response

