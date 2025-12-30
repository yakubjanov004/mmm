from typing import Any, Dict

from django.db import transaction
from rest_framework import serializers

from accounts.models import Department, Profile
from accounts.serializers import DepartmentSerializer, ProfileShortSerializer
from accounts.utils import get_user_profile
from works.models import Certificate, MethodicalWork, ResearchWork, SoftwareCertificate

# Utility functions for academic year handling
def format_academic_year(year: int) -> str:
    """Convert year to academic year format (e.g., 2024 -> '2024-2025')."""
    return f"{year}-{year + 1}"

def parse_academic_year(year_str: str | int) -> str:
    """Parse academic year format and return as 'YYYY-YYYY' string."""
    if isinstance(year_str, int):
        return format_academic_year(year_str)
    if isinstance(year_str, str):
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
        try:
            year_int = int(year_str)
            return format_academic_year(year_int)
        except ValueError:
            pass
    raise ValueError(f"Invalid year format: {year_str}")

class AcademicYearField(serializers.CharField):
    """Field that stores and displays year as 'YYYY-YYYY' format."""
    def to_representation(self, value):
        if value is None:
            return None
        if isinstance(value, int):
            return format_academic_year(value)
        return str(value)

    def to_internal_value(self, data):
        return parse_academic_year(data)

class WorkAuthorsField(serializers.PrimaryKeyRelatedField):
    def __init__(self, **kwargs):
        kwargs.setdefault('queryset', Profile.objects.all())
        super().__init__(**kwargs)

# Methodical Work Serializers
class MethodicalWorkWriteSerializer(serializers.ModelSerializer):
    year = AcademicYearField()
    authors = WorkAuthorsField(many=True)
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
        
        # Get file from request.FILES if not in validated_data
        if request and hasattr(request, "FILES"):
            if "file" not in validated_data and "file" in request.FILES:
                validated_data["file"] = request.FILES["file"]
            if "permission_file" not in validated_data and "permission_file" in request.FILES:
                validated_data["permission_file"] = request.FILES["permission_file"]
        
        # Handle file updates
        if "file" in validated_data and instance.file:
            instance.file.delete(save=False)
        if "permission_file" in validated_data and instance.permission_file:
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
    authors = WorkAuthorsField(many=True)
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
    authors = WorkAuthorsField(many=True)
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
    authors = WorkAuthorsField(many=True)
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