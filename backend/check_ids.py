import os
import django
import sys

sys.path.append(os.getcwd())
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from django.contrib.auth import get_user_model
from accounts.models import Profile

User = get_user_model()
users = User.objects.all()
print(f"Total Users: {users.count()}")

mismatch_count = 0
for user in users:
    try:
        profile = user.profile
        if user.id != profile.id:
            print(f"Mismatch! User ID: {user.id}, Profile ID: {profile.id}")
            mismatch_count += 1
    except Profile.DoesNotExist:
        print(f"User {user.id} has no profile")

if mismatch_count == 0:
    print("All User IDs match Profile IDs.")
else:
    print(f"Found {mismatch_count} mismatches.")
