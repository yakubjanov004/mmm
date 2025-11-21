# Generated manually for avatar field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0003_add_employment_profilename_models"),
    ]

    operations = [
        migrations.AddField(
            model_name="profile",
            name="avatar",
            field=models.ImageField(
                blank=True,
                help_text="Foydalanuvchi profil rasmi",
                null=True,
                upload_to="avatars/",
                verbose_name="Avatar",
            ),
        ),
    ]

