# Generated manually for Employment and ProfileName models

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("accounts", "0002_add_initial_positions"),
    ]

    operations = [
        migrations.CreateModel(
            name="Employment",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "employment_type",
                    models.CharField(
                        choices=[
                            ("MAIN", "Asosiy"),
                            ("INTERNAL", "Ichki o'rindosh"),
                            ("EXTERNAL", "Tashqi o'rindosh"),
                        ],
                        max_length=20,
                    ),
                ),
                (
                    "rate",
                    models.DecimalField(
                        decimal_places=2,
                        help_text="Ish stavkasi (masalan: 1.00, 0.75, 1.5)",
                        max_digits=5,
                    ),
                ),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "department",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="employments",
                        to="accounts.department",
                    ),
                ),
                (
                    "position",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="employments",
                        to="accounts.position",
                    ),
                ),
                (
                    "profile",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="employments",
                        to="accounts.profile",
                    ),
                ),
            ],
            options={
                "ordering": ["-is_active", "employment_type"],
            },
        ),
        migrations.CreateModel(
            name="ProfileName",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "language",
                    models.CharField(
                        choices=[
                            ("uz", "O'zbek"),
                            ("uzc", "O'zbek (Kirill)"),
                            ("ru", "Rus"),
                            ("en", "Ingliz"),
                        ],
                        max_length=3,
                    ),
                ),
                ("first_name", models.CharField(max_length=150)),
                ("last_name", models.CharField(max_length=150)),
                ("father_name", models.CharField(blank=True, max_length=150)),
                (
                    "profile",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="names",
                        to="accounts.profile",
                    ),
                ),
            ],
            options={
                "ordering": ["language"],
                "unique_together": {("profile", "language")},
            },
        ),
    ]

