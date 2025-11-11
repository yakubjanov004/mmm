from __future__ import annotations

from django.db import models

from accounts.models import Profile


class StoredFile(models.Model):
    file = models.FileField(upload_to="uploads/files/")
    owner = models.ForeignKey(
        Profile,
        on_delete=models.CASCADE,
        related_name="stored_files",
    )
    size = models.PositiveBigIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self) -> str:
        return f"{self.file.name} ({self.size} bytes)"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if self.file and self.size == 0:
            self.size = self.file.size
            super().save(update_fields=["size"])
