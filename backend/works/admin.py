from django.contrib import admin

from works.models import (
    Certificate,
    MethodicalWork,
    ResearchWork,
    SoftwareCertificate,
)


@admin.register(MethodicalWork)
class MethodicalWorkAdmin(admin.ModelAdmin):
    list_display = ("title", "year", "type", "department")
    list_filter = ("type", "department", "year")
    search_fields = ("title",)
    filter_horizontal = ("authors",)


@admin.register(ResearchWork)
class ResearchWorkAdmin(admin.ModelAdmin):
    list_display = ("title", "year", "type", "venue", "department")
    list_filter = ("type", "department", "year")
    search_fields = ("title", "venue")
    filter_horizontal = ("authors",)


@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = ("title", "year", "type", "publisher", "department")
    list_filter = ("type", "department", "year")
    search_fields = ("title", "publisher")
    filter_horizontal = ("authors",)


@admin.register(SoftwareCertificate)
class SoftwareCertificateAdmin(admin.ModelAdmin):
    list_display = ("title", "year", "type", "issued_by", "department")
    list_filter = ("type", "department", "year")
    search_fields = ("title", "issued_by", "cert_number")
    filter_horizontal = ("authors",)
