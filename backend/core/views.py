from __future__ import annotations

from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.http import require_GET


@require_GET
def health_check(request):
    if not settings.ENABLE_HEALTHCHECK:
        return JsonResponse({"status": "disabled"}, status=503)
    return JsonResponse({"status": "ok"})


def serve_media(request, path):
    """
    Serve media files in production.
    This view handles media file requests when DEBUG=False.
    """
    from django.views.static import serve
    
    return serve(request, path, document_root=settings.MEDIA_ROOT)
