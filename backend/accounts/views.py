from __future__ import annotations

from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema
from rest_framework import generics, permissions, viewsets
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView

from accounts.models import Department, Position
from accounts.permissions import IsAdmin
from accounts.serializers import (
    ChangePasswordSerializer,
    CustomTokenObtainPairSerializer,
    DepartmentSerializer,
    PositionSerializer,
    ProfileSerializer,
    UpdateProfileSerializer,
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
    tags=["Authentication"],
    summary="Change password",
    description="Change the password for the currently authenticated user.",
)
class ChangePasswordView(generics.GenericAPIView):
    serializer_class = ChangePasswordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Parol muvaffaqiyatli o'zgartirildi."}, status=200)


@extend_schema(
    tags=["Users"],
    summary="User management",
    description="CRUD operations for user management. List and retrieve are accessible to all authenticated users. Create, update, and delete are admin-only.",
)
class UserViewSet(viewsets.ModelViewSet):
    queryset = (
        User.objects.all()
        .select_related("profile", "profile__department", "profile__position")
        .order_by("username")
    )
    filter_backends = []

    def get_queryset(self):
        """
        Filter out admin and djangoadmin users from the list.
        """
        queryset = super().get_queryset()
        # Exclude admin and djangoadmin users from list view
        if self.action == "list":
            queryset = queryset.exclude(
                username__iexact="admin"
            ).exclude(
                username__iexact="djangoadmin"
            ).exclude(
                profile__role="ADMIN"
            )
        return queryset

    def get_permissions(self):
        """
        Allow all authenticated users to list and retrieve users (for author selection).
        Only admins can create, update, or delete users.
        """
        if self.action in {"list", "retrieve"}:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), IsAdmin()]

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


@extend_schema(
    tags=["Authentication"],
    summary="Upload avatar",
    description="Upload or update the avatar image for the currently authenticated user.",
)
class AvatarUploadView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        if "avatar" not in request.FILES:
            return Response({"detail": "Avatar fayl yuborilmadi."}, status=400)

        avatar_file = request.FILES["avatar"]
        
        # Validate file size (max 5MB)
        if avatar_file.size > 5 * 1024 * 1024:
            return Response({"detail": "Rasm hajmi 5MB dan katta bo'lishi mumkin emas."}, status=400)

        # Validate file type
        if not avatar_file.content_type.startswith("image/"):
            return Response({"detail": "Faqat rasm fayllari qabul qilinadi."}, status=400)

        profile = request.user.profile
        profile.avatar = avatar_file
        profile.save()

        serializer = ProfileSerializer(profile, context={"request": request})
        return Response(serializer.data, status=200)