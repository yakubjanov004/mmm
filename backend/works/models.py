from __future__ import annotations

from django.db import models

from accounts.models import Department, Profile


class WorkLanguage(models.TextChoices):
    UZBEK = "UZ", "O'zbek"
    RUSSIAN = "RU", "Rus"
    ENGLISH = "EN", "Ingliz"
    OTHER = "OTHER", "Boshqa"


class WorkBase(models.Model):
    title = models.CharField(max_length=255)
    year = models.PositiveIntegerField()
    language = models.CharField(
        max_length=16,
        choices=WorkLanguage.choices,
        default=WorkLanguage.UZBEK,
    )
    authors = models.ManyToManyField(
        Profile,
        related_name="authored_%(class)s",
        blank=True,
    )
    owner = models.ForeignKey(
        Profile,
        on_delete=models.CASCADE,
        related_name="owned_%(class)s",
    )
    department = models.ForeignKey(
        Department,
        on_delete=models.CASCADE,
        related_name="%(class)s_items",
    )
    is_department_visible = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        ordering = ("-year", "-created_at")

    def __str__(self) -> str:
        return f"{self.title} ({self.year})"


class MethodicalWork(WorkBase):
    class Types(models.TextChoices):
        INSTRUCTION = "INSTRUCTION", "Uslubiy ko'rsatma"
        GUIDE = "GUIDE", "Uslubiy qo'llanma"
        STUDY_GUIDE = "STUDY_GUIDE", "O'quv qo'llanma"
        TEXTBOOK = "TEXTBOOK", "Darslik"

    publisher = models.CharField(max_length=255, blank=True)
    type = models.CharField(max_length=32, choices=Types.choices)
    file = models.FileField(upload_to="works/methodical/")
    permission_file = models.FileField(
        upload_to="works/methodical/permissions/",
        blank=True,
        null=True,
    )
    description = models.TextField(blank=True)


class ResearchWork(WorkBase):
    class Types(models.TextChoices):
        LOCAL_ARTICLE = "LOCAL_ARTICLE", "Mahalliy maqola"
        FOREIGN_ARTICLE = "FOREIGN_ARTICLE", "Xorijiy maqola"
        LOCAL_THESIS = "LOCAL_THESIS", "Mahalliy tezis"
        FOREIGN_THESIS = "FOREIGN_THESIS", "Xorijiy tezis"
        LOCAL_MONOGRAPH = "LOCAL_MONOGRAPH", "Mahalliy monografiya"
        FOREIGN_MONOGRAPH = "FOREIGN_MONOGRAPH", "Xorijiy monografiya"

    venue = models.CharField(max_length=255)
    type = models.CharField(max_length=32, choices=Types.choices)
    file = models.FileField(upload_to="works/research/", blank=True, null=True)
    link = models.URLField(blank=True)


class Certificate(WorkBase):
    class Types(models.TextChoices):
        LOCAL = "LOCAL", "Mahalliy"
        INTERNATIONAL = "INTERNATIONAL", "Xalqaro"

    publisher = models.CharField(max_length=255)
    type = models.CharField(max_length=32, choices=Types.choices)
    file = models.FileField(upload_to="works/certificates/")
    description = models.TextField(blank=True)


class SoftwareCertificate(WorkBase):
    class Types(models.TextChoices):
        DGU = "DGU", "DGU"
        BGU = "BGU", "BGU"

    issued_by = models.CharField(max_length=255)
    approval_date = models.DateField()
    cert_number = models.CharField(max_length=255)
    type = models.CharField(max_length=32, choices=Types.choices)
    file = models.FileField(upload_to="works/software-certificates/")
