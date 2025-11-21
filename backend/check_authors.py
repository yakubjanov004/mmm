import os
import django
import sys

sys.path.append(os.getcwd())
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from accounts.models import Profile
from works.models import Certificate
from works.serializers import CertificateWriteSerializer

print("Testing update...")
try:
    c = Certificate.objects.first()
    if c:
        print(f"Updating Certificate {c.id}...")
        # Find a profile to add as author
        user = Profile.objects.first()
        if user:
            print(f"Adding author: {user.id} ({user.user.username})")
            data = {
                "authors": [user.id]
            }
            
            class MockRequest:
                def __init__(self, user):
                    self.user = user.user
                    self.FILES = {}
            
            serializer = CertificateWriteSerializer(c, data=data, partial=True, context={'request': MockRequest(user)})
            if serializer.is_valid():
                serializer.save()
                print("Update successful!")
                print(f"New authors count: {c.authors.count()}")
                print(f"Authors: {[a.id for a in c.authors.all()]}")
            else:
                print(f"Validation error: {serializer.errors}")
        else:
            print("No users found")
    else:
        print("No certificates found")
except Exception as e:
    print(f"Error: {e}")
