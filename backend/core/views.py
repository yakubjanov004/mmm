from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.http import require_GET


@require_GET
def health_check(request):
    return JsonResponse({"status": "ok"})


def serve_media(request, path):
    from django.views.static import serve
    return serve(request, path, document_root=settings.MEDIA_ROOT)
