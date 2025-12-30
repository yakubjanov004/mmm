from rest_framework.permissions import BasePermission, SAFE_METHODS

from accounts.models import Profile
from accounts.utils import get_user_profile


class StoredFileAccessPermission(BasePermission):
    def has_permission(self, request, view) -> bool:
        return bool(get_user_profile(request.user))

    def has_object_permission(self, request, view, obj) -> bool:
        profile = get_user_profile(request.user)
        if not profile:
            return False

        if profile.role == Profile.Roles.ADMIN:
            # Admin deletion allowed when explicitly permitted
            return True

        if profile.role == Profile.Roles.HOD:
            return obj.owner.department_id == profile.department_id

        if profile.role == Profile.Roles.TEACHER:
            if request.method in SAFE_METHODS:
                return obj.owner_id == profile.id
            return obj.owner_id == profile.id

        return False

