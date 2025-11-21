from django.core.management.base import BaseCommand
from works.models import Certificate, SoftwareCertificate


class Command(BaseCommand):
    help = "Add owners as authors to certificates and software certificates that don't have authors"

    def add_arguments(self, parser):
        parser.add_argument(
            "--force",
            action="store_true",
            help="Add owner as author even if authors already exist",
        )

    def handle(self, *args, **options):
        force = options.get("force", False)
        
        # Process Certificates
        certificates = Certificate.objects.all()
        cert_count = 0
        for cert in certificates:
            if cert.owner:
                if force or cert.authors.count() == 0:
                    # Add owner if not already in authors
                    if cert.owner not in cert.authors.all():
                        cert.authors.add(cert.owner)
                        cert_count += 1
                        self.stdout.write(
                            self.style.SUCCESS(
                                f'Added owner "{cert.owner}" as author to Certificate: {cert.title} (ID: {cert.id})'
                            )
                        )
                    else:
                        self.stdout.write(
                            self.style.WARNING(
                                f'Owner already in authors for Certificate: {cert.title} (ID: {cert.id})'
                            )
                        )

        # Process Software Certificates
        software_certs = SoftwareCertificate.objects.all()
        sc_count = 0
        for sc in software_certs:
            if sc.owner:
                if force or sc.authors.count() == 0:
                    # Add owner if not already in authors
                    if sc.owner not in sc.authors.all():
                        sc.authors.add(sc.owner)
                        sc_count += 1
                        self.stdout.write(
                            self.style.SUCCESS(
                                f'Added owner "{sc.owner}" as author to Software Certificate: {sc.title} (ID: {sc.id})'
                            )
                        )
                    else:
                        self.stdout.write(
                            self.style.WARNING(
                                f'Owner already in authors for Software Certificate: {sc.title} (ID: {sc.id})'
                            )
                        )

        self.stdout.write(
            self.style.SUCCESS(
                f'\nSuccessfully added authors to {cert_count} Certificate(s) and {sc_count} Software Certificate(s)'
            )
        )

