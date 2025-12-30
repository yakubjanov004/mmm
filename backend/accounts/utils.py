from typing import Optional

from django.contrib.auth import get_user_model


def get_user_profile(user) -> Optional["Profile"]:
    if not user or not getattr(user, "is_authenticated", False):
        return None
    return getattr(user, "profile", None)


User = get_user_model()

try:  # pragma: no cover
    from accounts.models import Profile
except Exception:  # pragma: no cover
    Profile = None  # type: ignore

