"""
Management command to create users with multilingual names.
Usage: python manage.py create_users
"""
from datetime import date

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from accounts.models import Department, Employment, Position, Profile, ProfileName

User = get_user_model()


# User data with real Uzbek names in all 4 languages
USERS_DATA = [
    {
        "username": "bobur.turayev",
        "email": "bobur.turayev@example.com",
        "role": Profile.Roles.HOD,
        "position": "Kafedra mudiri",
        "phone": "+998901234567",
        "birth_date": date(1980, 5, 15),
        "employment": {
            "employment_type": Employment.EmploymentType.MAIN,
            "rate": 1.00,
        },
        "names": {
            "uz": {"first_name": "Bobur", "last_name": "To'rayev", "father_name": "Abdulla o'g'li"},
            "uzc": {"first_name": "Бобур", "last_name": "Тўраев", "father_name": "Абдулла ўғли"},
            "ru": {"first_name": "Бобур", "last_name": "Тураев", "father_name": "Абдулла угли"},
            "en": {"first_name": "Bobur", "last_name": "Turayev", "father_name": "Abdulla ogli"},
        },
    },
    {
        "username": "aziz.akmalov",
        "email": "aziz.akmalov@example.com",
        "role": Profile.Roles.TEACHER,
        "position": "Dotsent",
        "phone": "+998901234568",
        "birth_date": date(1985, 8, 20),
        "employment": {
            "employment_type": Employment.EmploymentType.MAIN,
            "rate": 1.00,
        },
        "names": {
            "uz": {"first_name": "Aziz", "last_name": "Akmalov", "father_name": "Rustam o'g'li"},
            "uzc": {"first_name": "Азиз", "last_name": "Акмалов", "father_name": "Рустам ўғли"},
            "ru": {"first_name": "Азиз", "last_name": "Акмалов", "father_name": "Рустам угли"},
            "en": {"first_name": "Aziz", "last_name": "Akmalov", "father_name": "Rustam ogli"},
        },
    },
    {
        "username": "dilshoda.rahimova",
        "email": "dilshoda.rahimova@example.com",
        "role": Profile.Roles.TEACHER,
        "position": "Katta o'qituvchi",
        "phone": "+998901234569",
        "birth_date": date(1990, 3, 10),
        "employment": {
            "employment_type": Employment.EmploymentType.MAIN,
            "rate": 0.75,
        },
        "names": {
            "uz": {"first_name": "Dilshoda", "last_name": "Rahimova", "father_name": "Karim qizi"},
            "uzc": {"first_name": "Дилшода", "last_name": "Раҳимова", "father_name": "Карим қизи"},
            "ru": {"first_name": "Дилшода", "last_name": "Рахимова", "father_name": "Карим кизи"},
            "en": {"first_name": "Dilshoda", "last_name": "Rahimova", "father_name": "Karim qizi"},
        },
    },
    {
        "username": "javohir.sultonov",
        "email": "javohir.sultonov@example.com",
        "role": Profile.Roles.TEACHER,
        "position": "Professor",
        "phone": "+998901234570",
        "birth_date": date(1975, 12, 5),
        "employment": {
            "employment_type": Employment.EmploymentType.MAIN,
            "rate": 1.00,
        },
        "names": {
            "uz": {"first_name": "Javohir", "last_name": "Sultonov", "father_name": "Olim o'g'li"},
            "uzc": {"first_name": "Жавоҳир", "last_name": "Султонов", "father_name": "Олим ўғли"},
            "ru": {"first_name": "Жавохир", "last_name": "Султонов", "father_name": "Олим угли"},
            "en": {"first_name": "Javohir", "last_name": "Sultonov", "father_name": "Olim ogli"},
        },
    },
    {
        "username": "feruza.yusupova",
        "email": "feruza.yusupova@example.com",
        "role": Profile.Roles.TEACHER,
        "position": "O'qituvchi",
        "phone": "+998901234571",
        "birth_date": date(1992, 7, 25),
        "employment": {
            "employment_type": Employment.EmploymentType.MAIN,
            "rate": 1.00,
        },
        "names": {
            "uz": {"first_name": "Feruza", "last_name": "Yusupova", "father_name": "Shavkat qizi"},
            "uzc": {"first_name": "Феруза", "last_name": "Юсупова", "father_name": "Шавкат қизи"},
            "ru": {"first_name": "Феруза", "last_name": "Юсупова", "father_name": "Шавкат кизи"},
            "en": {"first_name": "Feruza", "last_name": "Yusupova", "father_name": "Shavkat qizi"},
        },
    },
    {
        "username": "sardor.mirzayev",
        "email": "sardor.mirzayev@example.com",
        "role": Profile.Roles.TEACHER,
        "position": "Dotsent",
        "phone": "+998901234572",
        "birth_date": date(1988, 9, 18),
        "employment": {
            "employment_type": Employment.EmploymentType.MAIN,
            "rate": 1.00,
        },
        "names": {
            "uz": {"first_name": "Sardor", "last_name": "Mirzayev", "father_name": "Bahodir o'g'li"},
            "uzc": {"first_name": "Сардор", "last_name": "Мирзаев", "father_name": "Баҳодир ўғли"},
            "ru": {"first_name": "Сардор", "last_name": "Мирзаев", "father_name": "Баходир угли"},
            "en": {"first_name": "Sardor", "last_name": "Mirzayev", "father_name": "Bahodir ogli"},
        },
    },
    {
        "username": "nigora.toshmatova",
        "email": "nigora.toshmatova@example.com",
        "role": Profile.Roles.TEACHER,
        "position": "Katta o'qituvchi",
        "phone": "+998901234573",
        "birth_date": date(1987, 4, 12),
        "employment": {
            "employment_type": Employment.EmploymentType.MAIN,
            "rate": 0.75,
        },
        "names": {
            "uz": {"first_name": "Nigora", "last_name": "Toshmatova", "father_name": "Akmal qizi"},
            "uzc": {"first_name": "Нигора", "last_name": "Тошматова", "father_name": "Акмал қизи"},
            "ru": {"first_name": "Нигора", "last_name": "Тошматова", "father_name": "Акмал кизи"},
            "en": {"first_name": "Nigora", "last_name": "Toshmatova", "father_name": "Akmal qizi"},
        },
    },
    {
        "username": "bekzod.umarov",
        "email": "bekzod.umarov@example.com",
        "role": Profile.Roles.TEACHER,
        "position": "O'qituvchi",
        "phone": "+998901234574",
        "birth_date": date(1991, 11, 30),
        "employment": {
            "employment_type": Employment.EmploymentType.MAIN,
            "rate": 1.00,
        },
        "names": {
            "uz": {"first_name": "Bekzod", "last_name": "Umarov", "father_name": "Jahongir o'g'li"},
            "uzc": {"first_name": "Бекзод", "last_name": "Умаров", "father_name": "Жаҳонгир ўғли"},
            "ru": {"first_name": "Бекзод", "last_name": "Умаров", "father_name": "Джахонгир угли"},
            "en": {"first_name": "Bekzod", "last_name": "Umarov", "father_name": "Jahongir ogli"},
        },
    },
]

PASSWORD = "ulugbek1"


class Command(BaseCommand):
    help = "Create users with multilingual names in all 4 languages"

    def add_arguments(self, parser):
        parser.add_argument(
            "--password",
            type=str,
            default=PASSWORD,
            help=f"Password for all users (default: {PASSWORD})",
        )
        parser.add_argument(
            "--skip-existing",
            action="store_true",
            help="Skip users that already exist",
        )

    def handle(self, *args, **options):
        password = options["password"]
        skip_existing = options["skip_existing"]

        # Get or create default department
        department, _ = Department.objects.get_or_create(
            name=Department.DEFAULT_NAME,
            defaults={"name": Department.DEFAULT_NAME},
        )

        created_count = 0
        skipped_count = 0
        error_count = 0

        for user_data in USERS_DATA:
            username = user_data["username"]
            
            # Check if user already exists
            if User.objects.filter(username=username).exists():
                if skip_existing:
                    self.stdout.write(
                        self.style.WARNING(f"User '{username}' already exists, skipping...")
                    )
                    skipped_count += 1
                    continue
                else:
                    self.stdout.write(
                        self.style.WARNING(f"User '{username}' already exists, updating...")
                    )
                    user = User.objects.get(username=username)
                    user.set_password(password)
                    user.email = user_data["email"]
                    user.save()
                    
                    # Get or create profile
                    try:
                        profile = user.profile
                    except Profile.DoesNotExist:
                        # Create profile if it doesn't exist
                        profile = Profile.objects.create(user=user, department=department)
                    
                    profile.role = user_data["role"]
                    if not profile.department:
                        profile.department = department
                    
                    # Update phone and birth_date
                    if user_data.get("phone"):
                        profile.phone = user_data["phone"]
                    if user_data.get("birth_date"):
                        profile.birth_date = user_data["birth_date"]
                    
                    profile.save()
                    
                    # Update or create position
                    if user_data.get("position"):
                        position, _ = Position.objects.get_or_create(
                            name=user_data["position"]
                        )
                        profile.position = position
                        profile.save()
                    
                    # Update or create names for all languages
                    for lang_code, name_data in user_data["names"].items():
                        ProfileName.objects.update_or_create(
                            profile=profile,
                            language=lang_code,
                            defaults={
                                "first_name": name_data["first_name"],
                                "last_name": name_data["last_name"],
                                "father_name": name_data.get("father_name", ""),
                            },
                        )
                    
                    # Update or create employment
                    if user_data.get("employment"):
                        employment_data = user_data["employment"]
                        position_for_employment = profile.position
                        Employment.objects.update_or_create(
                            profile=profile,
                            employment_type=employment_data["employment_type"],
                            defaults={
                                "rate": employment_data["rate"],
                                "department": profile.department,
                                "position": position_for_employment,
                                "is_active": True,
                            },
                        )
                    
                    self.stdout.write(
                        self.style.SUCCESS(f"Updated user '{username}' with all languages")
                    )
                    created_count += 1
                    continue

            try:
                # Create user
                user = User.objects.create_user(
                    username=username,
                    password=password,
                    email=user_data["email"],
                    first_name=user_data["names"]["uz"]["first_name"],
                    last_name=user_data["names"]["uz"]["last_name"],
                )

                # Profile is created automatically by signal, but we need to update it
                profile = user.profile
                profile.role = user_data["role"]
                profile.department = department
                
                # Set phone and birth_date
                if user_data.get("phone"):
                    profile.phone = user_data["phone"]
                if user_data.get("birth_date"):
                    profile.birth_date = user_data["birth_date"]
                
                # Create or get position
                position = None
                if user_data.get("position"):
                    position, _ = Position.objects.get_or_create(
                        name=user_data["position"]
                    )
                    profile.position = position
                
                profile.save()

                # Create names for all 4 languages
                for lang_code, name_data in user_data["names"].items():
                    ProfileName.objects.create(
                        profile=profile,
                        language=lang_code,
                        first_name=name_data["first_name"],
                        last_name=name_data["last_name"],
                        father_name=name_data.get("father_name", ""),
                    )
                
                # Create employment
                if user_data.get("employment"):
                    employment_data = user_data["employment"]
                    Employment.objects.create(
                        profile=profile,
                        employment_type=employment_data["employment_type"],
                        rate=employment_data["rate"],
                        department=profile.department,
                        position=position,
                        is_active=True,
                    )

                self.stdout.write(
                    self.style.SUCCESS(
                        f"Created user '{username}' ({user_data['role']}) with names in all 4 languages"
                    )
                )
                created_count += 1

            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f"Error creating user '{username}': {str(e)}")
                )
                error_count += 1

        # Summary
        self.stdout.write("\n" + "=" * 50)
        self.stdout.write(self.style.SUCCESS(f"Summary:"))
        self.stdout.write(f"  Created/Updated: {created_count}")
        if skipped_count > 0:
            self.stdout.write(f"  Skipped: {skipped_count}")
        if error_count > 0:
            self.stdout.write(self.style.ERROR(f"  Errors: {error_count}"))
        self.stdout.write(f"  Password for all users: {password}")
        self.stdout.write("=" * 50)

