from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.dispatch import receiver

from accounts.models import Department, Profile

User = get_user_model()


def _get_default_department() -> Department | None:
    try:
        return Department.objects.get(name=Department.DEFAULT_NAME)
    except Department.DoesNotExist:
        return None


@receiver(post_save, sender=User, dispatch_uid="create_profile_on_user_creation")
def create_profile_on_user_creation(sender, instance: User, created: bool, **kwargs):
    if not created:
        return
    department = _get_default_department()
    Profile.objects.create(user=instance, department=department)

