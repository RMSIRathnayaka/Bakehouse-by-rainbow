from django.contrib import admin
from .models import Product, Cart, CartItem, Order, OrderItem, Customization
from .models import CustomCake

admin.site.register(Product)
admin.site.register(Cart)
admin.site.register(CartItem)
admin.site.register(Order)
admin.site.register(OrderItem)
admin.site.register(Customization)
admin.site.register(CustomCake)
