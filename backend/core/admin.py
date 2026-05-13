from django.contrib import admin

from .models import Cart, CartItem, ContactMessage, CustomCake, Customization, Order, OrderItem, Product, Profile


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('product', 'quantity')


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'price', 'available')
    list_filter = ('category', 'available')
    search_fields = ('name', 'description')


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ('id', 'user')


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ('id', 'cart', 'product', 'quantity')


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'customer_display',
        'contact_phone',
        'delivery_date',
        'status',
        'payment_status',
        'payment_method',
        'created_at',
    )
    list_filter = ('status', 'payment_status', 'payment_method', 'delivery_date')
    search_fields = ('contact_name', 'contact_phone', 'contact_address', 'user__email')
    readonly_fields = ('created_at', 'order_date', 'free_gift')
    inlines = [OrderItemInline]

    def customer_display(self, obj):
        return obj.contact_name or obj.user.first_name or obj.user.email

    customer_display.short_description = 'Customer'


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ('id', 'order', 'product', 'quantity')


@admin.register(Customization)
class CustomizationAdmin(admin.ModelAdmin):
    list_display = ('id', 'order')


@admin.register(CustomCake)
class CustomCakeAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'occasion',
        'customer_display',
        'contact_phone',
        'delivery_date',
        'status',
        'payment_status',
        'created_at',
    )
    list_filter = ('status', 'payment_status', 'delivery_date')
    search_fields = ('occasion', 'contact_name', 'contact_phone', 'contact_address', 'user__email')
    readonly_fields = ('created_at',)

    def customer_display(self, obj):
        return obj.contact_name or (obj.user.first_name if obj.user else '') or (obj.user.email if obj.user else '')

    customer_display.short_description = 'Customer'


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'phone', 'address', 'role')
    list_filter = ('role',)
    search_fields = ('user__email', 'user__first_name', 'phone', 'address')


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ('subject', 'name', 'email', 'phone', 'status', 'created_at')
    list_filter = ('status',)
    search_fields = ('subject', 'name', 'email', 'message')
