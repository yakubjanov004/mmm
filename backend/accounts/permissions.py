from __future__ import annotations

from rest_framework.permissions import BasePermission

from accounts.models import Profile


def _get_profile(request) -> Profile | None:
    user = getattr(request, "user", None)
    if not user or not user.is_authenticated:
        return None
    return getattr(user, "profile", None)


class IsAdmin(BasePermission):
    def has_permission(self, request, view) -> bool:
        profile = _get_profile(request)
        return bool(profile and profile.role == Profile.Roles.ADMIN)

    def has_object_permission(self, request, view, obj) -> bool:
        return self.has_permission(request, view)


class IsHOD(BasePermission):
    def has_permission(self, request, view) -> bool:
        profile = _get_profile(request)
        return bool(profile and profile.role == Profile.Roles.HOD)


class IsTeacher(BasePermission):
    def has_permission(self, request, view) -> bool:
        profile = _get_profile(request)
        if not profile:
            return False
        # HOD also has TEACHER role access
        return bool(
            profile.role == Profile.Roles.TEACHER
            or profile.role == Profile.Roles.HOD
            or Profile.Roles.TEACHER in profile.available_roles
        )

