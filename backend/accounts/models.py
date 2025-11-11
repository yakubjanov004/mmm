from __future__ import annotations

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


class Department(models.Model):
    DEFAULT_NAME = "Robototexnika va intellektual tizimlar"

    name = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class Position(models.Model):
    name = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class Profile(models.Model):
    class Roles(models.TextChoices):
        ADMIN = "ADMIN", _("Admin")
        HOD = "HOD", _("Kafedra mudiri")
        TEACHER = "TEACHER", _("O'qituvchi")

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile",
    )
    role = models.CharField(
        max_length=20,
        choices=Roles.choices,
        default=Roles.TEACHER,
    )
    position = models.ForeignKey(
        Position,
        on_delete=models.SET_NULL,
        related_name="profiles",
        null=True,
        blank=True,
    )
    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        related_name="profiles",
        null=True,
        blank=True,
    )
    phone = models.CharField(max_length=32, blank=True)
    birth_date = models.DateField(null=True, blank=True)
    scopus = models.URLField(max_length=255, blank=True)
    scholar = models.URLField(max_length=255, blank=True)
    research_id = models.CharField(max_length=128, blank=True)
    user_id_str = models.CharField(_("User id"), max_length=64, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["user__username"]

    def __str__(self) -> str:
        return f"{self.user.get_full_name() or self.user.username} ({self.role})"
