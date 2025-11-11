from __future__ import annotations

from rest_framework.permissions import BasePermission, SAFE_METHODS

from accounts.models import Profile
from accounts.utils import get_user_profile


class WorkAccessPermission(BasePermission):
    def has_permission(self, request, view) -> bool:
        return bool(get_user_profile(request.user))

    def has_object_permission(self, request, view, obj) -> bool:
        profile = get_user_profile(request.user)
        if not profile:
            return False

        if profile.role == Profile.Roles.ADMIN:
            return True

        if profile.role == Profile.Roles.HOD:
            if obj.department_id == profile.department_id:
                return True
            return request.method in SAFE_METHODS and obj.is_department_visible

        if profile.role == Profile.Roles.TEACHER:
            owns = obj.owner_id == profile.id
            is_author = obj.authors.filter(id=profile.id).exists()
            if request.method in SAFE_METHODS:
                in_department = (
                    obj.department_id == profile.department_id
                    and obj.is_department_visible
                )
                return owns or is_author or in_department
            return owns or is_author

        return False

