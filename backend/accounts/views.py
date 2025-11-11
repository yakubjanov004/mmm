from __future__ import annotations

from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema
from rest_framework import generics, permissions, viewsets
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView

from accounts.models import Department, Position
from accounts.permissions import IsAdmin
from accounts.serializers import (
    CustomTokenObtainPairSerializer,
    DepartmentSerializer,
    PositionSerializer,
    ProfileSerializer,
    UserAdminReadSerializer,
    UserAdminWriteSerializer,
)

User = get_user_model()


@extend_schema(
    tags=["Departments"],
    summary="List all departments",
    description="Get a list of all departments in the system.",
)
class DepartmentListView(generics.ListAPIView):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticated]


@extend_schema(
    tags=["Positions"],
    summary="List all positions",
    description="Get a list of all positions in the system.",
)
class PositionListView(generics.ListAPIView):
    queryset = Position.objects.all()
    serializer_class = PositionSerializer
    permission_classes = [permissions.IsAuthenticated]


@extend_schema(
    tags=["Authentication"],
    summary="Get current user profile",
    description="Retrieve the profile information of the currently authenticated user.",
)
class CurrentUserView(generics.RetrieveAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user.profile


@extend_schema(
    tags=["Users"],
    summary="User management",
    description="CRUD operations for user management. Only accessible by administrators.",
)
class UserViewSet(viewsets.ModelViewSet):
    queryset = (
        User.objects.all()
        .select_related("profile", "profile__department", "profile__position")
        .order_by("username")
    )
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    filter_backends = []

    def get_serializer_class(self):
        if self.action in {"create", "update", "partial_update"}:
            return UserAdminWriteSerializer
        return UserAdminReadSerializer

    def destroy(self, request, *args, **kwargs):
        pk = kwargs.get("pk")
        if pk is not None and str(pk) == str(request.user.pk):
            return Response(
                {"detail": "You cannot delete yourself."},
                status=400,
            )
        return super().destroy(request, *args, **kwargs)


@extend_schema(
    tags=["Authentication"],
    summary="Login",
    description="Authenticate user and receive JWT access and refresh tokens.",
)
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
