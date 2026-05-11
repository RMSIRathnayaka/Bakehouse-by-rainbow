from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver


# Product Categories
CATEGORY_CHOICES = [
    ('wedding', 'Wedding Cake'),
    ('birthday', 'Birthday Cake'),
    ('cupcake', 'Cupcake'),
    ('bento', 'Bento Cake'),
    ('pastry', 'Pastry'),
    ('dessert', 'Dessert'),
]


class Product(models.Model):
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    image = models.ImageField(upload_to='products/')
    available = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class Cart(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.user.username}'s Cart"


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)


class Order(models.Model):
    PAYMENT_CHOICES = [
        ('online', 'Online Payment'),
        ('cod', 'Cash On Delivery'),
        
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    order_date = models.DateField(auto_now_add=True)
    delivery_date = models.DateField()   
    payment_method = models.CharField(max_length=10, choices=PAYMENT_CHOICES)
    is_customized = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    free_gift = models.BooleanField(default=False)

    def clean(self):
        # Limit 3 orders per day
        if Order.objects.filter(order_date=self.order_date).count() >= 3:
            raise ValidationError("Only 3 orders allowed per day.")

    def save(self, *args, **kwargs):
        # Check 5th order for free gift
        if Order.objects.filter(user=self.user).count() == 4:
            self.free_gift = True
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Order #{self.id} - {self.user.username}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)


class Customization(models.Model):
    order = models.OneToOneField(Order, on_delete=models.CASCADE)
    image = models.ImageField(upload_to='customizations/')
    details = models.TextField()


class CustomCake(models.Model):
    occasion = models.CharField(max_length=100)
    cake_size = models.CharField(max_length=50)
    flavor = models.CharField(max_length=100)
    color = models.CharField(max_length=100)
    shape = models.CharField(max_length=100)
    quantity = models.IntegerField()
    message = models.TextField(blank=True)
    special_instructions = models.TextField(blank=True)
    delivery_date = models.DateField()
    image = models.ImageField(upload_to='custom_cakes/', blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.occasion} - {self.delivery_date}"


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    phone = models.CharField(max_length=15)

    def __str__(self):
        return self.user.username        


@receiver(post_save, sender=User)
def create_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)