from django.contrib import admin

from files.models import StoredFile


@admin.register(StoredFile)
class StoredFileAdmin(admin.ModelAdmin):
    list_display = ("file", "owner", "size", "created_at")
    list_filter = ("owner__department",)
    search_fields = ("file", "owner__user__username")
