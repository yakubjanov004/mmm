from django.apps import AppConfig
from django.conf import settings
from pathlib import Path


class WorksConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'works'

    def ready(self):
        """Create media directories if they don't exist."""
        if hasattr(settings, 'MEDIA_ROOT'):
            media_root = Path(settings.MEDIA_ROOT)
            # Create all required media directories
            directories = [
                media_root / "works" / "methodical",
                media_root / "works" / "methodical" / "permissions",
                media_root / "works" / "research",
                media_root / "works" / "certificates",
                media_root / "works" / "software-certificates",
                media_root / "uploads" / "files",
            ]
            for directory in directories:
                directory.mkdir(parents=True, exist_ok=True)
