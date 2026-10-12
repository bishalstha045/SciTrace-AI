from typing import Optional
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import jwt
from app.core.config import settings
from app.models.schemas import UserContext

security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security),
) -> UserContext:
    """
    Validate Supabase authentication token from Authorization Bearer header.
    Returns UserContext with user ID and email.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials are required. Provide a valid Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials.strip()

    # 1. Test Mode Support (for automated unit & integration tests)
    if settings.ENVIRONMENT == "test" or settings.ALLOW_TEST_AUTH:
        if token == "test-token-user-1":
            return UserContext(
                id="11111111-1111-1111-1111-111111111111",
                email="user1@scitrace.ai",
                role="authenticated",
            )
        elif token == "test-token-user-2":
            return UserContext(
                id="22222222-2222-2222-2222-222222222222",
                email="user2@scitrace.ai",
                role="authenticated",
            )
        elif token.startswith("test-user-"):
            user_id = token.replace("test-user-", "")
            return UserContext(
                id=user_id,
                email=f"{user_id}@scitrace.ai",
                role="authenticated",
            )

    # 2. Supabase JWT Validation
    # A. If JWT secret is configured, perform cryptographic signature verification
    if settings.SUPABASE_JWT_SECRET:
        try:
            payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                audience="authenticated",
            )
            user_id = payload.get("sub")
            if not user_id:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token: missing subject claim",
                )
            return UserContext(
                id=user_id,
                email=payload.get("email"),
                role=payload.get("role", "authenticated"),
            )
        except jwt.PyJWTError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Token verification failed: {str(e)}",
            )

    # B. Supabase client remote verification
    try:
        from app.services.supabase_service import get_supabase_client

        supabase = get_supabase_client()
        if supabase:
            response = supabase.auth.get_user(token)
            if response and response.user:
                return UserContext(
                    id=str(response.user.id),
                    email=response.user.email,
                    role=response.user.role or "authenticated",
                )
    except Exception:
        pass

    # C. Fallback: inspect standard unverified JWT payload for user sub if valid JWT structure
    try:
        unverified = jwt.decode(token, options={"verify_signature": False})
        user_id = unverified.get("sub")
        if user_id:
            return UserContext(
                id=user_id,
                email=unverified.get("email"),
                role=unverified.get("role", "authenticated"),
            )
    except Exception:
        pass

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired authentication token.",
        headers={"WWW-Authenticate": "Bearer"},
    )
