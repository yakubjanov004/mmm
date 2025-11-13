from __future__ import annotations

from typing import Any, Dict

from django.db import transaction
from rest_framework import serializers

from accounts.models import Department, Profile
from accounts.serializers import DepartmentSerializer, ProfileShortSerializer
from accounts.utils import get_user_profile
from works.models import Certificate, MethodicalWork, ResearchWork, SoftwareCertificate


def format_academic_year(year: int) -> str:
    """Convert year to academic year format (e.g., 2024 -> '2024-2025')."""
    return f"{year}-{year + 1}"


def parse_academic_year(year_str: str | int) -> str:
    """Parse academic year format and return as 'YYYY-YYYY' string."""
    if isinstance(year_str, int):
        # If it's an integer, convert to academic year format
        return format_academic_year(year_str)
    if isinstance(year_str, str):
        # If format is "2024-2025", validate and return as is
        if "-" in year_str:
            parts = year_str.split("-")
            if len(parts) == 2:
                try:
                    first_year = int(parts[0])
                    second_year = int(parts[1])
                    if second_year == first_year + 1:
                        return year_str
                except ValueError:
                    pass
        # If format is just "2024", convert to "2024-2025"
        try:
            year_int = int(year_str)
            return format_academic_year(year_int)
        except ValueError:
            pass
    raise ValueError(f"Invalid year format: {year_str}")


class AcademicYearField(serializers.CharField):
    """Field that stores and displays year as '2024-2025' string format."""
    
    def to_representation(self, value):
        """Return stored year string as is (already in '2024-2025' format)."""
        if value is None:
            return None
        # If somehow stored as integer, convert it
        if isinstance(value, int):
            return format_academic_year(value)
        return str(value)
    
    def to_internal_value(self, data):
        """Convert input ('2024-2025' or 2024) to stored format ('2024-2025')."""
        return parse_academic_year(data)

WORK_WRITE_BASE_FIELDS = (
    "id",
    "title",
    "year",
    "language",
    "authors",
    "owner",
    "department",
    "is_department_visible",
)

WORK_READ_BASE_FIELDS = WORK_WRITE_BASE_FIELDS + (
    "created_at",
    "updated_at",
)


class WorkAuthorsField(serializers.PrimaryKeyRelatedField):
    """
    Accepts User IDs from frontend and converts them to Profile IDs.
    """
    def __init__(self, **kwargs):
        kwargs.setdefault("many", True)
        kwargs.setdefault("queryset", Profile.objects.all())
        kwargs.setdefault("required", False)
        super().__init__(**kwargs)
    
    def to_internal_value(self, data):
        # If data is a User ID, convert it to Profile ID
        try:
            user_id = int(data)
            # Try to find Profile by user.id
            from django.contrib.auth import get_user_model
            User = get_user_model()
            try:
                user = User.objects.get(id=user_id)
                profile = Profile.objects.get(user=user)
                return super().to_internal_value(profile.id)
            except (User.DoesNotExist, Profile.DoesNotExist):
                # If not found, try as Profile ID directly
                return super().to_internal_value(data)
        except (ValueError, TypeError):
            # If not a number, try as Profile ID directly
            return super().to_internal_value(data)


# Methodical Work Serializers
class MethodicalWorkWriteSerializer(serializers.ModelSerializer):
    year = AcademicYearField()
    authors = WorkAuthorsField()
    department = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(),
        required=False,
        allow_null=True,
    )
    owner = serializers.PrimaryKeyRelatedField(
        queryset=Profile.objects.all(),
        required=False,
    )

    class Meta:
        model = MethodicalWork
        fields = (
            "title",
            "year",
            "language",
            "type",
            "publisher",
            "file",
            "permission_file",
            "description",
            "authors",
            "owner",
            "department",
            "is_department_visible",
        )
        extra_kwargs = {
            "file": {"required": False, "allow_null": True},
            "permission_file": {"required": False, "allow_null": True},
        }

    def create(self, validated_data):
        authors = validated_data.pop("authors", [])
        request = self.context.get("request")
        profile = get_user_profile(request.user) if request else None

        if not profile:
            raise serializers.ValidationError("User profile not found.")

        if "owner" not in validated_data:
            validated_data["owner"] = profile

        if "department" not in validated_data or not validated_data["department"]:
            validated_data["department"] = profile.department or Department.objects.filter(
                name=Department.DEFAULT_NAME
            ).first()

        # Get files from request.FILES if not in validated_data
        if request and hasattr(request, "FILES"):
            if "file" not in validated_data and "file" in request.FILES:
                validated_data["file"] = request.FILES["file"]
            if "permission_file" not in validated_data and "permission_file" in request.FILES:
                validated_data["permission_file"] = request.FILES["permission_file"]

        with transaction.atomic():
            instance = MethodicalWork.objects.create(**validated_data)
            if authors:
                instance.authors.set(authors)
            return instance

    def update(self, instance, validated_data):
        authors = validated_data.pop("authors", None)
        request = self.context.get("request")
        
        # Get files from request.FILES if not in validated_data
        if request and hasattr(request, "FILES"):
            if "file" not in validated_data and "file" in request.FILES:
                validated_data["file"] = request.FILES["file"]
            if "permission_file" not in validated_data and "permission_file" in request.FILES:
                validated_data["permission_file"] = request.FILES["permission_file"]
        
        # Handle file updates - delete old files if new ones are provided
        if "file" in validated_data and instance.file:
            # Delete old file
            instance.file.delete(save=False)
        if "permission_file" in validated_data and instance.permission_file:
            # Delete old permission file
            instance.permission_file.delete(save=False)
        
        with transaction.atomic():
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            instance.save()
            if authors is not None:
                instance.authors.set(authors)
        return instance

    def to_representation(self, instance):
        """Override to properly serialize authors field for output."""
        representation = super().to_representation(instance)
        # Convert authors ManyRelatedManager to list of IDs
        representation['authors'] = [author.id for author in instance.authors.all()]
        return representation


class MethodicalWorkListSerializer(serializers.ModelSerializer):
    year = AcademicYearField()
    authors = ProfileShortSerializer(many=True, read_only=True)
    owner = ProfileShortSerializer(read_only=True)
    department = DepartmentSerializer(read_only=True)
    file_url = serializers.SerializerMethodField()
    permission_file_url = serializers.SerializerMethodField()

    class Meta:
        model = MethodicalWork
        fields = (
            "id",
            "title",
            "year",
            "language",
            "type",
            "publisher",
            "file_url",
            "permission_file_url",
            "description",
            "authors",
            "owner",
            "department",
            "is_department_visible",
            "created_at",
            "updated_at",
        )

    def get_file_url(self, obj: MethodicalWork) -> str | None:
        if obj.file:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None

    def get_permission_file_url(self, obj: MethodicalWork) -> str | None:
        if obj.permission_file:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.permission_file.url)
            return obj.permission_file.url
        return None


class MethodicalWorkDetailSerializer(MethodicalWorkListSerializer):
    pass


# Research Work Serializers
class ResearchWorkWriteSerializer(serializers.ModelSerializer):
    year = AcademicYearField()
    authors = WorkAuthorsField()
    department = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(),
        required=False,
        allow_null=True,
    )
    owner = serializers.PrimaryKeyRelatedField(
        queryset=Profile.objects.all(),
        required=False,
    )

    class Meta:
        model = ResearchWork
        fields = (
            "title",
            "year",
            "language",
            "type",
            "venue",
            "file",
            "link",
            "authors",
            "owner",
            "department",
            "is_department_visible",
        )

    def create(self, validated_data):
        authors = validated_data.pop("authors", [])
        request = self.context.get("request")
        profile = get_user_profile(request.user) if request else None

        if not profile:
            raise serializers.ValidationError("User profile not found.")

        if "owner" not in validated_data:
            validated_data["owner"] = profile

        if "department" not in validated_data or not validated_data["department"]:
            validated_data["department"] = profile.department or Department.objects.filter(
                name=Department.DEFAULT_NAME
            ).first()

        # Get file from request.FILES if not in validated_data
        if request and hasattr(request, "FILES"):
            if "file" not in validated_data and "file" in request.FILES:
                validated_data["file"] = request.FILES["file"]

        with transaction.atomic():
            instance = ResearchWork.objects.create(**validated_data)
            if authors:
                instance.authors.set(authors)
            return instance

    def update(self, instance, validated_data):
        authors = validated_data.pop("authors", None)
        request = self.context.get("request")
        
        # Get file from request.FILES if not in validated_data
        if request and hasattr(request, "FILES"):
            if "file" not in validated_data and "file" in request.FILES:
                validated_data["file"] = request.FILES["file"]
        
        # Handle file updates - delete old file if new one is provided
        if "file" in validated_data and instance.file:
            # Delete old file
            instance.file.delete(save=False)
        
        with transaction.atomic():
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            instance.save()
            if authors is not None:
                instance.authors.set(authors)
        return instance

    def to_representation(self, instance):
        """Override to properly serialize authors field for output."""
        representation = super().to_representation(instance)
        # Convert authors ManyRelatedManager to list of IDs
        representation['authors'] = [author.id for author in instance.authors.all()]
        return representation


class ResearchWorkListSerializer(serializers.ModelSerializer):
    year = AcademicYearField()
    authors = ProfileShortSerializer(many=True, read_only=True)
    owner = ProfileShortSerializer(read_only=True)
    department = DepartmentSerializer(read_only=True)
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = ResearchWork
        fields = (
            "id",
            "title",
            "year",
            "language",
            "type",
            "venue",
            "file_url",
            "link",
            "authors",
            "owner",
            "department",
            "is_department_visible",
            "created_at",
            "updated_at",
        )

    def get_file_url(self, obj: ResearchWork) -> str | None:
        if obj.file:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None


class ResearchWorkDetailSerializer(ResearchWorkListSerializer):
    pass


# Certificate Serializers
class CertificateWriteSerializer(serializers.ModelSerializer):
    year = AcademicYearField()
    authors = WorkAuthorsField()
    department = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(),
        required=False,
        allow_null=True,
    )
    owner = serializers.PrimaryKeyRelatedField(
        queryset=Profile.objects.all(),
        required=False,
    )

    class Meta:
        model = Certificate
        fields = (
            "title",
            "year",
            "language",
            "type",
            "publisher",
            "file",
            "description",
            "authors",
            "owner",
            "department",
            "is_department_visible",
        )
        extra_kwargs = {
            "file": {"required": False, "allow_null": True},
            "publisher": {"required": False, "allow_blank": True},
        }

    def create(self, validated_data):
        authors = validated_data.pop("authors", [])
        request = self.context.get("request")
        profile = get_user_profile(request.user) if request else None

        if not profile:
            raise serializers.ValidationError("User profile not found.")

        if "owner" not in validated_data:
            validated_data["owner"] = profile

        if "department" not in validated_data or not validated_data["department"]:
            validated_data["department"] = profile.department or Department.objects.filter(
                name=Department.DEFAULT_NAME
            ).first()

        # Get file from request.FILES if not in validated_data
        if request and hasattr(request, "FILES"):
            if "file" not in validated_data and "file" in request.FILES:
                validated_data["file"] = request.FILES["file"]

        with transaction.atomic():
            instance = Certificate.objects.create(**validated_data)
            if authors:
                instance.authors.set(authors)
            return instance

    def update(self, instance, validated_data):
        authors = validated_data.pop("authors", None)
        request = self.context.get("request")
        
        # Get file from request.FILES if not in validated_data
        if request and hasattr(request, "FILES"):
            if "file" not in validated_data and "file" in request.FILES:
                validated_data["file"] = request.FILES["file"]
        
        # Handle file updates - delete old file if new one is provided
        if "file" in validated_data and instance.file:
            # Delete old file
            instance.file.delete(save=False)
        
        with transaction.atomic():
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            instance.save()
            if authors is not None:
                instance.authors.set(authors)
        return instance

    def to_representation(self, instance):
        """Override to properly serialize authors field for output."""
        representation = super().to_representation(instance)
        # Convert authors ManyRelatedManager to list of IDs
        representation['authors'] = [author.id for author in instance.authors.all()]
        return representation


class CertificateListSerializer(serializers.ModelSerializer):
    year = AcademicYearField()
    authors = ProfileShortSerializer(many=True, read_only=True)
    owner = ProfileShortSerializer(read_only=True)
    department = DepartmentSerializer(read_only=True)
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Certificate
        fields = (
            "id",
            "title",
            "year",
            "language",
            "type",
            "publisher",
            "file_url",
            "description",
            "authors",
            "owner",
            "department",
            "is_department_visible",
            "created_at",
            "updated_at",
        )

    def get_file_url(self, obj: Certificate) -> str | None:
        if obj.file:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None


class CertificateDetailSerializer(CertificateListSerializer):
    pass


# Software Certificate Serializers
class SoftwareCertificateWriteSerializer(serializers.ModelSerializer):
    year = AcademicYearField()
    authors = WorkAuthorsField()
    department = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(),
        required=False,
        allow_null=True,
    )
    owner = serializers.PrimaryKeyRelatedField(
        queryset=Profile.objects.all(),
        required=False,
    )

    class Meta:
        model = SoftwareCertificate
        fields = (
            "title",
            "year",
            "language",
            "type",
            "issued_by",
            "approval_date",
            "cert_number",
            "file",
            "authors",
            "owner",
            "department",
            "is_department_visible",
        )
        extra_kwargs = {
            "file": {"required": False, "allow_null": True},
            "issued_by": {"required": False, "allow_blank": True},
            "approval_date": {"required": False, "allow_null": True},
            "cert_number": {"required": False, "allow_blank": True},
        }

    def create(self, validated_data):
        authors = validated_data.pop("authors", [])
        request = self.context.get("request")
        profile = get_user_profile(request.user) if request else None

        if not profile:
            raise serializers.ValidationError("User profile not found.")

        if "owner" not in validated_data:
            validated_data["owner"] = profile

        if "department" not in validated_data or not validated_data["department"]:
            validated_data["department"] = profile.department or Department.objects.filter(
                name=Department.DEFAULT_NAME
            ).first()

        # Get file from request.FILES if not in validated_data
        if request and hasattr(request, "FILES"):
            if "file" not in validated_data and "file" in request.FILES:
                validated_data["file"] = request.FILES["file"]

        with transaction.atomic():
            instance = SoftwareCertificate.objects.create(**validated_data)
            if authors:
                instance.authors.set(authors)
            return instance

    def update(self, instance, validated_data):
        authors = validated_data.pop("authors", None)
        request = self.context.get("request")
        
        # Get file from request.FILES if not in validated_data
        if request and hasattr(request, "FILES"):
            if "file" not in validated_data and "file" in request.FILES:
                validated_data["file"] = request.FILES["file"]
        
        # Handle file updates - delete old file if new one is provided
        if "file" in validated_data and instance.file:
            # Delete old file
            instance.file.delete(save=False)
        
        with transaction.atomic():
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            instance.save()
            if authors is not None:
                instance.authors.set(authors)
        return instance

    def to_representation(self, instance):
        """Override to properly serialize authors field for output."""
        representation = super().to_representation(instance)
        # Convert authors ManyRelatedManager to list of IDs
        representation['authors'] = [author.id for author in instance.authors.all()]
        return representation


class SoftwareCertificateListSerializer(serializers.ModelSerializer):
    year = AcademicYearField()
    authors = ProfileShortSerializer(many=True, read_only=True)
    owner = ProfileShortSerializer(read_only=True)
    department = DepartmentSerializer(read_only=True)
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = SoftwareCertificate
        fields = (
            "id",
            "title",
            "year",
            "language",
            "type",
            "issued_by",
            "approval_date",
            "cert_number",
            "file_url",
            "authors",
            "owner",
            "department",
            "is_department_visible",
            "created_at",
            "updated_at",
        )

    def get_file_url(self, obj: SoftwareCertificate) -> str | None:
        if obj.file:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None


class SoftwareCertificateDetailSerializer(SoftwareCertificateListSerializer):
    pass