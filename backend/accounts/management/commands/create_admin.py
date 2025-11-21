"""
Management command to create the first admin user.
Usage: python manage.py create_admin
"""
import os
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from accounts.models import Department, Profile

User = get_user_model()


class Command(BaseCommand):
    help = "Create the first admin user"

    def add_arguments(self, parser):
        parser.add_argument(
            "--username",
            type=str,
            default=os.getenv("ADMIN_USERNAME", "admin"),
            help="Username for admin user (default: from ADMIN_USERNAME env or 'admin')",
        )
        parser.add_argument(
            "--password",
            type=str,
            default=os.getenv("ADMIN_PASSWORD", "admin123"),
            help="Password for admin user (default: from ADMIN_PASSWORD env or 'admin123')",
        )
        parser.add_argument(
            "--email",
            type=str,
            default=os.getenv("ADMIN_EMAIL", "admin@example.com"),
            help="Email for admin user (default: from ADMIN_EMAIL env or 'admin@example.com')",
        )
        parser.add_argument(
            "--first-name",
            type=str,
            default="Admin",
            help="First name for admin user (default: Admin)",
        )
        parser.add_argument(
            "--last-name",
            type=str,
            default="User",
            help="Last name for admin user (default: User)",
        )
        parser.add_argument(
            "--force",
            action="store_true",
            help="Force update existing admin user",
        )

    def handle(self, *args, **options):
        username = options["username"]
        password = options["password"]
        email = options["email"]
        first_name = options["first_name"]
        last_name = options["last_name"]
        force = options["force"]

        # Check if user with this username already exists
        if User.objects.filter(username=username).exists():
            if not force:
                user = User.objects.get(username=username)
                # Check if already admin
                if user.profile.role == Profile.Roles.ADMIN:
                    self.stdout.write(
                        self.style.WARNING(
                            f"Admin user '{username}' already exists! Use --force to update."
                        )
                    )
                    return
            # Update existing user to be admin
            user = User.objects.get(username=username)
            profile = user.profile
            profile.role = Profile.Roles.ADMIN
            if not profile.department:
                department, _ = Department.objects.get_or_create(
                    name=Department.DEFAULT_NAME,
                    defaults={"name": Department.DEFAULT_NAME},
                )
                profile.department = department
            profile.save()
            user.set_password(password)
            user.email = email
            user.first_name = first_name
            user.last_name = last_name
            user.save()
            self.stdout.write(
                self.style.SUCCESS(
                    f"Existing user '{username}' updated to admin!\n"
                    f"Username: {username}\n"
                    f"Password: {password}"
                )
            )
            return

        # Check if admin user already exists
        if User.objects.filter(profile__role=Profile.Roles.ADMIN).exists() and not force:
            self.stdout.write(
                self.style.WARNING("Admin user already exists! Use --force to create another.")
            )
            return

        # Get or create default department
        department, _ = Department.objects.get_or_create(
            name=Department.DEFAULT_NAME,
            defaults={"name": Department.DEFAULT_NAME},
        )

        # Create admin user
        user = User.objects.create_user(
            username=username,
            password=password,
            email=email,
            first_name=first_name,
            last_name=last_name,
        )

        # Update profile to be admin
        profile = user.profile
        profile.role = Profile.Roles.ADMIN
        profile.department = department
        profile.save()

        self.stdout.write(
            self.style.SUCCESS(
                f"Admin user created successfully!\n"
                f"Username: {username}\n"
                f"Password: {password}\n"
                f"Email: {email}"
            )
        )

