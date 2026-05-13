import shutil
from decimal import Decimal
from pathlib import Path

from django.conf import settings
from django.contrib.auth.models import User
from django.core.management.base import BaseCommand

from core.models import Product, Profile


class Command(BaseCommand):
    help = "Seed admin user and base cake catalog data."

    def handle(self, *args, **options):
        admin = self.seed_user(
            email="admin@gmail.com",
            password="admin123",
            first_name="Admin",
            last_name="User",
            role="admin",
            phone="",
            is_staff=True,
            is_superuser=True,
        )

        products = self.seed_products()

        self.stdout.write(self.style.SUCCESS(f"Seeded admin user {admin.email}"))
        self.stdout.write(self.style.SUCCESS(f"Seeded {len(products)} products with backend media paths"))

    def seed_user(
        self,
        email,
        password,
        first_name,
        last_name,
        role,
        phone,
        is_staff=False,
        is_superuser=False,
    ):
        user, _ = User.objects.get_or_create(
            email=email,
            defaults={
                "username": email,
                "first_name": first_name,
                "last_name": last_name,
                "is_staff": is_staff,
                "is_superuser": is_superuser,
            },
        )

        user.username = email
        user.email = email
        user.first_name = first_name
        user.last_name = last_name
        user.is_staff = is_staff
        user.is_superuser = is_superuser
        user.is_active = True
        user.set_password(password)
        user.save()

        profile, _ = Profile.objects.get_or_create(user=user)
        profile.role = role
        profile.phone = phone
        profile.save()

        return user

    def seed_products(self):
        media_root = Path(settings.MEDIA_ROOT)
        product_dir = media_root / "products"
        custom_dir = media_root / "custom_cakes"
        product_dir.mkdir(parents=True, exist_ok=True)

        catalog = [
            {
                "name": "Chocolate Ganache Celebration Cake",
                "category": "birthday",
                "description": "Layered chocolate sponge with ganache, buttercream, and celebration piping.",
                "price": Decimal("3500.00"),
                "source": product_dir / "WhatsApp_Image_2026-02-22_at_1.48.33_AM_1.jpeg",
                "target": "chocolate-ganache-celebration.jpeg",
            },
            {
                "name": "Bento Rose Mini Cake",
                "category": "bento",
                "description": "Compact rose-themed bento cake for gifting, birthdays, and small celebrations.",
                "price": Decimal("1800.00"),
                "source": custom_dir / "bento-bc-r-003-500x500.jpeg",
                "target": "bento-rose-mini-cake.jpeg",
            },
            {
                "name": "Wedding Floral Ribbon Cake",
                "category": "wedding",
                "description": "Elegant floral ribbon cake with soft buttercream finish for wedding tables.",
                "price": Decimal("9200.00"),
                "source": custom_dir / "dc-r-015-500x500.jpeg",
                "target": "wedding-floral-ribbon-cake.jpeg",
            },
            {
                "name": "Classic Ribbon Cake",
                "category": "dessert",
                "description": "Soft vanilla ribbon cake with a balanced cream layer and clean bakery finish.",
                "price": Decimal("2400.00"),
                "source": custom_dir / "18669862_285776680128_0.43275900-1725949645.jpeg",
                "target": "classic-ribbon-cake.jpeg",
            },
        ]

        products = []
        fallback_image = next(product_dir.glob("*"), None)

        for item in catalog:
            source = item["source"] if item["source"].exists() else fallback_image
            target = product_dir / item["target"]

            if source and source.exists() and source.resolve() != target.resolve():
                shutil.copyfile(source, target)

            image_path = f"products/{target.name}" if target.exists() else ""
            product, _ = Product.objects.update_or_create(
                name=item["name"],
                defaults={
                    "category": item["category"],
                    "description": item["description"],
                    "price": item["price"],
                    "available": True,
                    "image": image_path,
                },
            )
            products.append(product)

        return products
