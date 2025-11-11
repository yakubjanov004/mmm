from __future__ import annotations

from django.db.models import Q
from drf_spectacular.utils import extend_schema
from rest_framework import permissions, viewsets
from rest_framework.parsers import FormParser, MultiPartParser

from accounts.models import Profile
from accounts.utils import get_user_profile
from works.models import (
    Certificate,
    MethodicalWork,
    ResearchWork,
    SoftwareCertificate,
)
from works.permissions import WorkAccessPermission
from works.serializers import (
    CertificateDetailSerializer,
    CertificateListSerializer,
    CertificateWriteSerializer,
    MethodicalWorkDetailSerializer,
    MethodicalWorkListSerializer,
    MethodicalWorkWriteSerializer,
    ResearchWorkDetailSerializer,
    ResearchWorkListSerializer,
    ResearchWorkWriteSerializer,
    SoftwareCertificateDetailSerializer,
    SoftwareCertificateListSerializer,
    SoftwareCertificateWriteSerializer,
)


class WorkViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, WorkAccessPermission]
    filterset_fields = ("year", "language", "type")
    search_fields = ("title",)
    ordering = ("-year", "-created_at")
    serializer_action_classes = {}
    model = None
    parser_classes = (MultiPartParser, FormParser)

    def get_queryset(self):
        profile = get_user_profile(self.request.user)
        if not profile:
            return self.model.objects.none()

        queryset = (
            self.model.objects.all()
            .select_related("owner__user", "department")
            .prefetch_related("authors__user")
        )

        if profile.role == Profile.Roles.ADMIN:
            return queryset

        if profile.role == Profile.Roles.HOD:
            return queryset.filter(department=profile.department)

        if profile.role == Profile.Roles.TEACHER:
            return queryset.filter(
                Q(owner=profile)
                | Q(authors=profile)
                | Q(
                    is_department_visible=True,
                    department=profile.department,
                )
            ).distinct()

        return queryset.none()

    def get_serializer_class(self):
        if hasattr(self, "serializer_action_classes"):
            return self.serializer_action_classes.get(self.action, super().get_serializer_class())
        return super().get_serializer_class()


@extend_schema(
    tags=["Methodical Works"],
    summary="Methodical works management",
    description="CRUD operations for methodical works (uslubiy ishlar).",
)
class MethodicalWorkViewSet(WorkViewSet):
    model = MethodicalWork
    serializer_class = MethodicalWorkDetailSerializer
    serializer_action_classes = {
        "list": MethodicalWorkListSerializer,
        "retrieve": MethodicalWorkDetailSerializer,
        "create": MethodicalWorkWriteSerializer,
        "update": MethodicalWorkWriteSerializer,
        "partial_update": MethodicalWorkWriteSerializer,
    }


@extend_schema(
    tags=["Research Works"],
    summary="Research works management",
    description="CRUD operations for research works (ilmiy ishlar).",
)
class ResearchWorkViewSet(WorkViewSet):
    model = ResearchWork
    serializer_class = ResearchWorkDetailSerializer
    serializer_action_classes = {
        "list": ResearchWorkListSerializer,
        "retrieve": ResearchWorkDetailSerializer,
        "create": ResearchWorkWriteSerializer,
        "update": ResearchWorkWriteSerializer,
        "partial_update": ResearchWorkWriteSerializer,
    }


@extend_schema(
    tags=["Certificates"],
    summary="Certificates management",
    description="CRUD operations for certificates (sertifikatlar).",
)
class CertificateViewSet(WorkViewSet):
    model = Certificate
    serializer_class = CertificateDetailSerializer
    serializer_action_classes = {
        "list": CertificateListSerializer,
        "retrieve": CertificateDetailSerializer,
        "create": CertificateWriteSerializer,
        "update": CertificateWriteSerializer,
        "partial_update": CertificateWriteSerializer,
    }


@extend_schema(
    tags=["Software Certificates"],
    summary="Software certificates management",
    description="CRUD operations for software certificates (dasturiy guvohnomalar).",
)
class SoftwareCertificateViewSet(WorkViewSet):
    model = SoftwareCertificate
    serializer_class = SoftwareCertificateDetailSerializer
    serializer_action_classes = {
        "list": SoftwareCertificateListSerializer,
        "retrieve": SoftwareCertificateDetailSerializer,
        "create": SoftwareCertificateWriteSerializer,
        "update": SoftwareCertificateWriteSerializer,
        "partial_update": SoftwareCertificateWriteSerializer,
    }
