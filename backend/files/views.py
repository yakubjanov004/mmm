from django.conf import settings
from drf_spectacular.utils import extend_schema
from rest_framework import mixins, permissions, status, viewsets
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from accounts.models import Profile
from accounts.utils import get_user_profile
from files.models import StoredFile
from files.permissions import StoredFileAccessPermission
from files.serializers import StoredFileListSerializer, StoredFileUploadSerializer


@extend_schema(
    tags=["Files"],
    summary="File storage management",
    description="Upload, list, and delete files. Supports PDF, DOCX, PPTX, PNG, JPG formats.",
)
class StoredFileViewSet(mixins.ListModelMixin, mixins.CreateModelMixin, mixins.DestroyModelMixin, viewsets.GenericViewSet):
    queryset = StoredFile.objects.all().select_related("owner__user", "owner__department")
    permission_classes = [permissions.IsAuthenticated, StoredFileAccessPermission]
    parser_classes = (MultiPartParser, FormParser)
    serializer_class = StoredFileListSerializer
    serializer_action_classes = {
        "create": StoredFileUploadSerializer,
        "list": StoredFileListSerializer,
        "destroy": StoredFileListSerializer,
    }

    def get_queryset(self):
        profile = get_user_profile(self.request.user)
        if not profile:
            return StoredFile.objects.none()

        qs = self.queryset

        if profile.role == Profile.Roles.ADMIN:
            if settings.FILES_ADMIN_CAN_VIEW:
                return qs
            return StoredFile.objects.none()

        if profile.role == Profile.Roles.HOD:
            return qs.filter(owner__department=profile.department)

        return qs.filter(owner=profile)

    def get_serializer_class(self):
        return self.serializer_action_classes.get(self.action, super().get_serializer_class())

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        read_serializer = StoredFileListSerializer(
            instance,
            context=self.get_serializer_context(),
        )
        headers = self.get_success_headers(read_serializer.data)
        return Response(read_serializer.data, status=status.HTTP_201_CREATED, headers=headers)
