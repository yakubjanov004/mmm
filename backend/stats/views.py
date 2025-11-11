from __future__ import annotations

from typing import Callable, Dict

from django.db.models import Count, QuerySet, Q
from drf_spectacular.utils import extend_schema
from rest_framework import permissions
from rest_framework.generics import GenericAPIView
from rest_framework.response import Response

from accounts.models import Profile
from accounts.permissions import IsAdmin, IsHOD, IsTeacher
from accounts.utils import get_user_profile
from stats.serializers import StatsResponseSerializer
from works.models import Certificate, MethodicalWork, ResearchWork, SoftwareCertificate

WorkQueryMap = Dict[str, QuerySet]


def _base_queryset_map() -> WorkQueryMap:
    return {
        "methodical": MethodicalWork.objects.all(),
        "research": ResearchWork.objects.all(),
        "certificate": Certificate.objects.all(),
        "software_certificate": SoftwareCertificate.objects.all(),
    }


def _aggregate(qs: QuerySet, field: str) -> list[dict]:
    return list(
        qs.values(field)
        .annotate(total=Count("id"))
        .order_by(field)
    )


def _build_stats(qs_map: WorkQueryMap) -> dict:
    return {
        "totals": {key: qs.count() for key, qs in qs_map.items()},
        "by_year": {key: _aggregate(qs, "year") for key, qs in qs_map.items()},
        "by_type": {key: _aggregate(qs, "type") for key, qs in qs_map.items()},
        "by_language": {
            key: _aggregate(qs, "language") for key, qs in qs_map.items()
        },
    }


def _filtered_map(filter_fn: Callable[[QuerySet], QuerySet]) -> WorkQueryMap:
    return {key: filter_fn(qs) for key, qs in _base_queryset_map().items()}


@extend_schema(
    tags=["Statistics"],
    summary="Admin statistics",
    description="Get statistics for all works across the system. Only accessible by administrators.",
    responses={200: StatsResponseSerializer},
)
class AdminStatsView(GenericAPIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    serializer_class = StatsResponseSerializer

    def get(self, request):
        stats = _build_stats(_filtered_map(lambda qs: qs))
        return Response(stats)


@extend_schema(
    tags=["Statistics"],
    summary="Department statistics",
    description="Get statistics for works in the user's department. Only accessible by Head of Department (HOD).",
    responses={200: StatsResponseSerializer},
)
class DepartmentStatsView(GenericAPIView):
    permission_classes = [permissions.IsAuthenticated, IsHOD]
    serializer_class = StatsResponseSerializer

    def get(self, request):
        profile = get_user_profile(request.user)
        if not profile or not profile.department_id:
            return Response({"detail": "Kafedra aniqlanmadi."}, status=400)

        def filter_department(qs: QuerySet) -> QuerySet:
            return qs.filter(department_id=profile.department_id)

        stats = _build_stats(_filtered_map(filter_department))
        return Response(stats)


@extend_schema(
    tags=["Statistics"],
    summary="Personal statistics",
    description="Get statistics for works owned or co-authored by the current user. Only accessible by teachers.",
    responses={200: StatsResponseSerializer},
)
class PersonalStatsView(GenericAPIView):
    permission_classes = [permissions.IsAuthenticated, IsTeacher]
    serializer_class = StatsResponseSerializer

    def get(self, request):
        profile = get_user_profile(request.user)
        if not profile:
            return Response({"detail": "Profil topilmadi."}, status=400)

        def filter_personal(qs: QuerySet) -> QuerySet:
            return qs.filter(
                Q(owner=profile) | Q(authors=profile)
            ).distinct()

        stats = _build_stats(_filtered_map(filter_personal))
        return Response(stats)
