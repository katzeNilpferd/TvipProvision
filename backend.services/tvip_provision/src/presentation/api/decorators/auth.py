import inspect
from functools import wraps
from typing import Any, Callable, TypeVar, cast

from config import settings

AUTH_ENABLED = settings.auth_enabled


F = TypeVar('F', bound=Callable[..., Any])


def optional_auth_endpoint(func: F) -> F:
    """
    Decorator that:
    - When AUTH_ENABLED=true: keeps the `current_user` parameter enabled
    - When AUTH_ENABLED=false: removes `current_user` from the function signature

    Usage example:

    @app.get("/items/")
    @optional_auth_endpoint
    async def read_items(current_user: User = Depends(get_current_user)):
        ...
    """

    @wraps(func)
    async def wrapper(*args: Any, **kwargs: Any) -> Any:
        # If auth is disabled but the function received current_user - ignore it
        if not AUTH_ENABLED and 'current_user' in kwargs:
            kwargs.pop('current_user')
        
        return await func(*args, **kwargs)
    
    if not AUTH_ENABLED:
        sig = inspect.signature(func)
        params = list(sig.parameters.values())
        
        new_params = [p for p in params if p.name != 'current_user']
        wrapper.__signature__ = sig.replace(parameters=new_params)  #type: ignore
    
    return cast(F, wrapper)
