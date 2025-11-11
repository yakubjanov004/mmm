from __future__ import annotations

from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.http import require_GET


@require_GET
def health_check(request):
    if not settings.ENABLE_HEALTHCHECK:
        return JsonResponse({"status": "disabled"}, status=503)
    return JsonResponse({"status": "ok"})

