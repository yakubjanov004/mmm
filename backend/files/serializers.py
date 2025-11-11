from __future__ import annotations

import mimetypes
import os

from django.conf import settings
from rest_framework import serializers

from accounts.serializers import ProfileShortSerializer
from accounts.utils import get_user_profile
from files.models import StoredFile


ALLOWED_EXTENSIONS = {".pdf", ".docx", ".pptx", ".png", ".jpg", ".jpeg"}
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "image/png",
    "image/jpeg",
}


class StoredFileListSerializer(serializers.ModelSerializer):
    owner = ProfileShortSerializer(read_only=True)
    url = serializers.SerializerMethodField()

    class Meta:
        model = StoredFile
        fields = ("id", "file", "url", "size", "owner", "created_at")
        read_only_fields = fields

    def get_url(self, obj: StoredFile) -> str:
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(obj.file.url)
        return obj.file.url


class StoredFileUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoredFile
        fields = ("id", "file")
        read_only_fields = ("id",)

    def validate_file(self, value):
        extension = os.path.splitext(value.name)[1].lower()
        if extension not in ALLOWED_EXTENSIONS:
            raise serializers.ValidationError("Yuklanayotgan fayl turi qo'llab-quvvatlanmaydi.")
        mime, _ = mimetypes.guess_type(value.name)
        if mime and mime not in ALLOWED_MIME_TYPES:
            raise serializers.ValidationError("Yuklanayotgan fayl MIME turi qo'llab-quvvatlanmaydi.")
        return value

    def create(self, validated_data):
        request = self.context["request"]
        profile = get_user_profile(request.user)
        instance = StoredFile.objects.create(owner=profile, **validated_data)
        instance.size = instance.file.size
        instance.save(update_fields=["size"])
        return instance

