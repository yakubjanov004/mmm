"""
Management command to setup the entire database from scratch.
This command runs migrations, creates initial data, admin user, and sample data.
Usage: python manage.py setup_database
"""
import os
from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.db import transaction


class Command(BaseCommand):
    help = "Setup the entire database: migrations, initial data, admin, and sample data"

    def add_arguments(self, parser):
        parser.add_argument(
            "--skip-migrations",
            action="store_true",
            help="Skip running migrations",
        )
        parser.add_argument(
            "--skip-sample-data",
            action="store_true",
            help="Skip creating sample users and works",
        )
        parser.add_argument(
            "--admin-username",
            type=str,
            default=os.getenv("ADMIN_USERNAME", "admin"),
            help="Admin username (default: from ADMIN_USERNAME env or 'admin')",
        )
        parser.add_argument(
            "--admin-password",
            type=str,
            default=os.getenv("ADMIN_PASSWORD", "admin123"),
            help="Admin password (default: from ADMIN_PASSWORD env or 'admin123')",
        )
        parser.add_argument(
            "--admin-email",
            type=str,
            default=os.getenv("ADMIN_EMAIL", "admin@example.com"),
            help="Admin email (default: from ADMIN_EMAIL env or 'admin@example.com')",
        )
        parser.add_argument(
            "--force-update-admin",
            action="store_true",
            help="Force update existing admin user (useful for fixing is_staff/is_superuser flags)",
        )

    def handle(self, *args, **options):
        skip_migrations = options["skip_migrations"]
        skip_sample_data = options["skip_sample_data"]
        admin_username = options["admin_username"]
        admin_password = options["admin_password"]
        admin_email = options["admin_email"]
        force_update_admin = options["force_update_admin"]

        self.stdout.write(self.style.SUCCESS("=" * 60))
        self.stdout.write(self.style.SUCCESS("Starting database setup..."))
        self.stdout.write("=" * 60)

        # Step 1: Run migrations (migrations handle their own transactions)
        if not skip_migrations:
            self.stdout.write("\n[1/5] Running migrations...")
            try:
                call_command("migrate", verbosity=0, interactive=False)
                self.stdout.write(self.style.SUCCESS("✓ Migrations completed"))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"✗ Migration error: {str(e)}"))
                raise

        # Step 2: Collect static files (for production)
        self.stdout.write("\n[2/5] Collecting static files...")
        try:
            call_command("collectstatic", verbosity=0, interactive=False, clear=True)
            self.stdout.write(self.style.SUCCESS("✓ Static files collected"))
        except Exception as e:
            self.stdout.write(self.style.WARNING(f"⚠ Static files warning: {str(e)}"))

        # Step 3: Create admin user (use transaction for data operations)
        self.stdout.write("\n[3/5] Creating admin user...")
        try:
            with transaction.atomic():
                create_admin_kwargs = {
                    "username": admin_username,
                    "password": admin_password,
                    "email": admin_email,
                }
                if force_update_admin:
                    create_admin_kwargs["force"] = True
                call_command("create_admin", **create_admin_kwargs)
            self.stdout.write(
                self.style.SUCCESS(
                    f"✓ Admin user created/updated: {admin_username}"
                )
            )
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"✗ Admin creation error: {str(e)}"))
            raise

        # Step 4: Create sample users (optional)
        if not skip_sample_data:
            self.stdout.write("\n[4/5] Creating sample users...")
            try:
                with transaction.atomic():
                    call_command("create_users", skip_existing=True)
                self.stdout.write(self.style.SUCCESS("✓ Sample users created"))
            except Exception as e:
                self.stdout.write(
                    self.style.WARNING(f"⚠ Sample users warning: {str(e)}")
                )

            # Step 5: Create sample works (optional)
            self.stdout.write("\n[5/5] Creating sample works...")
            try:
                with transaction.atomic():
                    call_command("create_works")
                self.stdout.write(self.style.SUCCESS("✓ Sample works created"))
            except Exception as e:
                self.stdout.write(
                    self.style.WARNING(f"⚠ Sample works warning: {str(e)}")
                )
        else:
            self.stdout.write("\n[4/5] Skipping sample data creation...")
            self.stdout.write(self.style.WARNING("⚠ Sample data skipped"))

        # Summary
        self.stdout.write("\n" + "=" * 60)
        self.stdout.write(self.style.SUCCESS("Database setup completed successfully!"))
        self.stdout.write("=" * 60)
        self.stdout.write(f"\nAdmin credentials:")
        self.stdout.write(f"  Username: {admin_username}")
        self.stdout.write(f"  Password: {admin_password}")
        self.stdout.write(f"  Email: {admin_email}")
        self.stdout.write("\n")

