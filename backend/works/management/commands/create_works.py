"""
Management command to create various works (methodical, research, certificates, software certificates) for users.
Usage: python manage.py create_works
"""
from datetime import date, timedelta
from random import choice, randint

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from accounts.models import Department, Profile
from works.models import (
    Certificate,
    MethodicalWork,
    ResearchWork,
    SoftwareCertificate,
    WorkLanguage,
)

User = get_user_model()


# Real Uzbek academic work titles
METHODICAL_WORKS = [
    {
        "title": "Robototexnika asoslari: O'quv qo'llanma",
        "type": MethodicalWork.Types.TEXTBOOK,
        "publisher": "Toshkent davlat texnika universiteti",
        "description": "Robototexnika sohasidagi asosiy bilimlar va amaliy ko'nikmalarni o'z ichiga olgan o'quv qo'llanma.",
        "language": WorkLanguage.UZBEK,
    },
    {
        "title": "Sun'iy intellekt va mashina o'rganishi: Uslubiy qo'llanma",
        "type": MethodicalWork.Types.GUIDE,
        "publisher": "O'zbekiston milliy universiteti",
        "description": "Sun'iy intellekt va mashina o'rganishi bo'yicha uslubiy qo'llanma.",
        "language": WorkLanguage.UZBEK,
    },
    {
        "title": "Dasturlash asoslari: Uslubiy ko'rsatma",
        "type": MethodicalWork.Types.INSTRUCTION,
        "publisher": "Toshkent axborot texnologiyalari universiteti",
        "description": "Dasturlash asoslarini o'qitish bo'yicha uslubiy ko'rsatma.",
        "language": WorkLanguage.UZBEK,
    },
    {
        "title": "Ma'lumotlar bazasi tizimlari: O'quv qo'llanma",
        "type": MethodicalWork.Types.STUDY_GUIDE,
        "publisher": "Toshkent davlat texnika universiteti",
        "description": "Ma'lumotlar bazasi tizimlarini o'rganish uchun o'quv qo'llanma.",
        "language": WorkLanguage.UZBEK,
    },
    {
        "title": "Kompyuter tarmoqlari: Darslik",
        "type": MethodicalWork.Types.TEXTBOOK,
        "publisher": "O'zbekiston milliy universiteti",
        "description": "Kompyuter tarmoqlari bo'yicha darslik.",
        "language": WorkLanguage.UZBEK,
    },
    {
        "title": "Web dasturlash texnologiyalari: Uslubiy qo'llanma",
        "type": MethodicalWork.Types.GUIDE,
        "publisher": "Toshkent axborot texnologiyalari universiteti",
        "description": "Web dasturlash texnologiyalari bo'yicha uslubiy qo'llanma.",
        "language": WorkLanguage.UZBEK,
    },
]

RESEARCH_WORKS = [
    {
        "title": "Robototexnika tizimlarida sun'iy intellektdan foydalanish",
        "type": ResearchWork.Types.LOCAL_ARTICLE,
        "venue": "O'zbekiston Respublikasi Fanlar akademiyasi axborotnomasi",
        "link": "https://example.com/research1",
        "language": WorkLanguage.UZBEK,
    },
    {
        "title": "Machine Learning Algorithms for Robotics Applications",
        "type": ResearchWork.Types.FOREIGN_ARTICLE,
        "venue": "IEEE Robotics and Automation Letters",
        "link": "https://example.com/research2",
        "language": WorkLanguage.ENGLISH,
    },
    {
        "title": "Intellektual robototexnika tizimlarini loyihalash",
        "type": ResearchWork.Types.LOCAL_MONOGRAPH,
        "venue": "Toshkent davlat texnika universiteti",
        "link": "",
        "language": WorkLanguage.UZBEK,
    },
    {
        "title": "Neural Networks in Autonomous Systems",
        "type": ResearchWork.Types.FOREIGN_ARTICLE,
        "venue": "International Journal of Robotics Research",
        "link": "https://example.com/research3",
        "language": WorkLanguage.ENGLISH,
    },
    {
        "title": "Ma'lumotlarni qayta ishlashda sun'iy intellekt",
        "type": ResearchWork.Types.LOCAL_ARTICLE,
        "venue": "O'zbekiston milliy universiteti ilmiy jurnali",
        "link": "https://example.com/research4",
        "language": WorkLanguage.UZBEK,
    },
    {
        "title": "Computer Vision for Industrial Automation",
        "type": ResearchWork.Types.FOREIGN_THESIS,
        "venue": "International Conference on Automation",
        "link": "https://example.com/research5",
        "language": WorkLanguage.ENGLISH,
    },
]

CERTIFICATES = [
    {
        "title": "Robototexnika sohasidagi xalqaro sertifikat",
        "type": Certificate.Types.INTERNATIONAL,
        "publisher": "IEEE Robotics Society",
        "description": "Robototexnika sohasidagi xalqaro sertifikat.",
        "language": WorkLanguage.ENGLISH,
    },
    {
        "title": "Sun'iy intellekt bo'yicha malaka oshirish sertifikati",
        "type": Certificate.Types.LOCAL,
        "publisher": "O'zbekiston Respublikasi Ta'lim vazirligi",
        "description": "Sun'iy intellekt bo'yicha malaka oshirish kursi sertifikati.",
        "language": WorkLanguage.UZBEK,
    },
    {
        "title": "Machine Learning Specialist Certificate",
        "type": Certificate.Types.INTERNATIONAL,
        "publisher": "Coursera",
        "description": "Machine Learning Specialist certification from Coursera.",
        "language": WorkLanguage.ENGLISH,
    },
    {
        "title": "Dasturlash texnologiyalari bo'yicha sertifikat",
        "type": Certificate.Types.LOCAL,
        "publisher": "Toshkent axborot texnologiyalari universiteti",
        "description": "Zamonaviy dasturlash texnologiyalari bo'yicha sertifikat.",
        "language": WorkLanguage.UZBEK,
    },
]

SOFTWARE_CERTIFICATES = [
    {
        "title": "Robototexnika simulyatsiya dasturi",
        "type": SoftwareCertificate.Types.DGU,
        "issued_by": "O'zbekiston Respublikasi Ta'lim vazirligi",
        "cert_number": "DGU-2024-001",
        "approval_date": date(2024, 3, 15),
        "language": WorkLanguage.UZBEK,
    },
    {
        "title": "Intellektual tizimlar boshqaruv dasturi",
        "type": SoftwareCertificate.Types.BGU,
        "issued_by": "O'zbekiston Respublikasi Ta'lim vazirligi",
        "cert_number": "BGU-2024-002",
        "approval_date": date(2024, 5, 20),
        "language": WorkLanguage.UZBEK,
    },
    {
        "title": "Machine Learning Training Platform",
        "type": SoftwareCertificate.Types.DGU,
        "issued_by": "Ministry of Education",
        "cert_number": "DGU-2024-003",
        "approval_date": date(2024, 7, 10),
        "language": WorkLanguage.ENGLISH,
    },
    {
        "title": "Ma'lumotlar bazasi boshqaruv tizimi",
        "type": SoftwareCertificate.Types.BGU,
        "issued_by": "O'zbekiston Respublikasi Ta'lim vazirligi",
        "cert_number": "BGU-2024-004",
        "approval_date": date(2024, 9, 5),
        "language": WorkLanguage.UZBEK,
    },
]


def get_academic_year(year_offset: int = 0) -> str:
    """Get academic year in format YYYY-YYYY+1."""
    current_year = timezone.now().year + year_offset
    return f"{current_year}-{current_year + 1}"


class Command(BaseCommand):
    help = "Create various works (methodical, research, certificates, software certificates) for users"

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear-existing",
            action="store_true",
            help="Clear existing works before creating new ones",
        )

    def handle(self, *args, **options):
        clear_existing = options["clear_existing"]

        # Get default department
        try:
            department = Department.objects.get(name=Department.DEFAULT_NAME)
        except Department.DoesNotExist:
            self.stdout.write(
                self.style.ERROR("Default department not found. Please create it first.")
            )
            return

        # Get all teacher and HOD profiles
        profiles = Profile.objects.filter(
            role__in=[Profile.Roles.TEACHER, Profile.Roles.HOD]
        ).select_related("user", "department")

        if not profiles.exists():
            self.stdout.write(
                self.style.WARNING("No teacher or HOD profiles found. Please create users first.")
            )
            return

        if clear_existing:
            self.stdout.write("Clearing existing works...")
            MethodicalWork.objects.all().delete()
            ResearchWork.objects.all().delete()
            Certificate.objects.all().delete()
            SoftwareCertificate.objects.all().delete()
            self.stdout.write(self.style.SUCCESS("Existing works cleared."))

        created_methodical = 0
        created_research = 0
        created_certificates = 0
        created_software_certs = 0

        # Distribute works among users
        profiles_list = list(profiles)
        methodical_works = METHODICAL_WORKS.copy()
        research_works = RESEARCH_WORKS.copy()
        certificates_list = CERTIFICATES.copy()
        software_certs = SOFTWARE_CERTIFICATES.copy()

        for i, profile in enumerate(profiles_list):
            # Assign department if not set
            if not profile.department:
                profile.department = department
                profile.save()

            # Create 1-3 methodical works per user
            num_methodical = randint(1, 3)
            for _ in range(num_methodical):
                if not methodical_works:
                    methodical_works = METHODICAL_WORKS.copy()
                
                work_data = methodical_works.pop(0)
                work = MethodicalWork.objects.create(
                    title=work_data["title"],
                    year=get_academic_year(randint(-2, 0)),  # Last 2-3 years
                    language=work_data["language"],
                    type=work_data["type"],
                    publisher=work_data["publisher"],
                    description=work_data["description"],
                    owner=profile,
                    department=profile.department or department,
                    is_department_visible=True,
                )
                # Add owner as author
                work.authors.add(profile)
                # Sometimes add co-authors (other teachers from same department)
                if randint(1, 3) == 1 and len(profiles_list) > 1:
                    co_author = choice([p for p in profiles_list if p != profile])
                    work.authors.add(co_author)
                
                created_methodical += 1

            # Create 2-4 research works per user
            num_research = randint(2, 4)
            for _ in range(num_research):
                if not research_works:
                    research_works = RESEARCH_WORKS.copy()
                
                work_data = research_works.pop(0)
                work = ResearchWork.objects.create(
                    title=work_data["title"],
                    year=get_academic_year(randint(-3, 0)),  # Last 3-4 years
                    language=work_data["language"],
                    type=work_data["type"],
                    venue=work_data["venue"],
                    link=work_data["link"],
                    owner=profile,
                    department=profile.department or department,
                    is_department_visible=True,
                )
                # Add owner as author
                work.authors.add(profile)
                # Sometimes add co-authors
                if randint(1, 2) == 1 and len(profiles_list) > 1:
                    co_author = choice([p for p in profiles_list if p != profile])
                    work.authors.add(co_author)
                
                created_research += 1

            # Create 1-2 certificates per user
            num_certs = randint(1, 2)
            for _ in range(num_certs):
                if not certificates_list:
                    certificates_list = CERTIFICATES.copy()
                
                cert_data = certificates_list.pop(0)
                Certificate.objects.create(
                    title=cert_data["title"],
                    year=get_academic_year(randint(-2, 0)),
                    language=cert_data["language"],
                    type=cert_data["type"],
                    publisher=cert_data["publisher"],
                    description=cert_data["description"],
                    owner=profile,
                    department=profile.department or department,
                    is_department_visible=True,
                )
                created_certificates += 1

            # Create 1 software certificate per user (sometimes)
            if randint(1, 2) == 1:
                if not software_certs:
                    software_certs = SOFTWARE_CERTIFICATES.copy()
                
                cert_data = software_certs.pop(0)
                SoftwareCertificate.objects.create(
                    title=cert_data["title"],
                    year=get_academic_year(randint(-1, 0)),
                    language=cert_data["language"],
                    type=cert_data["type"],
                    issued_by=cert_data["issued_by"],
                    cert_number=cert_data["cert_number"],
                    approval_date=cert_data["approval_date"],
                    owner=profile,
                    department=profile.department or department,
                    is_department_visible=True,
                )
                created_software_certs += 1

        # Summary
        self.stdout.write("\n" + "=" * 50)
        self.stdout.write(self.style.SUCCESS("Summary:"))
        self.stdout.write(f"  Methodical Works: {created_methodical}")
        self.stdout.write(f"  Research Works: {created_research}")
        self.stdout.write(f"  Certificates: {created_certificates}")
        self.stdout.write(f"  Software Certificates: {created_software_certs}")
        self.stdout.write(f"  Total: {created_methodical + created_research + created_certificates + created_software_certs}")
        self.stdout.write("=" * 50)

