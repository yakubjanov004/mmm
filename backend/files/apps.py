from django.apps import AppConfig
from django.conf import settings
from pathlib import Path


class FilesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'files'

    def ready(self):
        """Create media directories if they don't exist."""
        if hasattr(settings, 'MEDIA_ROOT'):
            media_root = Path(settings.MEDIA_ROOT)
            # Create uploads/files directory
            uploads_dir = media_root / "uploads" / "files"
            uploads_dir.mkdir(parents=True, exist_ok=True)
