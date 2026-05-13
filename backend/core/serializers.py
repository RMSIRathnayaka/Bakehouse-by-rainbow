from rest_framework import serializers
from .models import Product, Order, OrderItem, Customization
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework.validators import UniqueValidator
from .models import Cart, CartItem
from .models import CustomCake, ContactMessage, Profile
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.exceptions import AuthenticationFailed


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'


class OrderItemSerializer(serializers.ModelSerializer):
    product_detail = ProductSerializer(source='product', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_image = serializers.ImageField(source='product.image', read_only=True)
    unit_price = serializers.DecimalField(source='product.price', max_digits=10, decimal_places=2, read_only=True)
    line_total = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_detail', 'product_name', 'product_image', 'quantity', 'unit_price', 'line_total']

    def get_line_total(self, obj):
        return obj.product.price * obj.quantity


class CustomizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customization
        fields = '__all__'

class CustomCakeSerializer(serializers.ModelSerializer):
    customer_name = serializers.SerializerMethodField()
    customer_email = serializers.EmailField(source='user.email', read_only=True)
    customer_phone = serializers.SerializerMethodField()
    customer_address = serializers.SerializerMethodField()

    class Meta:
        model = CustomCake
        fields = '__all__'
        read_only_fields = ['user']

    def get_customer_name(self, obj):
        if not obj.user:
            return obj.contact_name
        full_name = obj.user.first_name.strip()
        return obj.contact_name or full_name or obj.user.email

    def get_customer_phone(self, obj):
        if obj.contact_phone:
            return obj.contact_phone
        if obj.user and hasattr(obj.user, 'profile'):
            return obj.user.profile.phone
        return ""

    def get_customer_address(self, obj):
        if obj.contact_address:
            return obj.contact_address
        if obj.user and hasattr(obj.user, 'profile'):
            return obj.user.profile.address
        return ""

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(source='orderitem_set', many=True, read_only=True)
    customer_name = serializers.SerializerMethodField()
    customer_email = serializers.EmailField(source='user.email', read_only=True)
    customer_phone = serializers.SerializerMethodField()
    customer_address = serializers.SerializerMethodField()
    total_amount = serializers.SerializerMethodField()
    total_items = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = '__all__'
        read_only_fields = ['user', 'free_gift']

    def get_customer_name(self, obj):
        full_name = obj.user.first_name.strip()
        return obj.contact_name or full_name or obj.user.email

    def get_customer_phone(self, obj):
        if obj.contact_phone:
            return obj.contact_phone
        if hasattr(obj.user, 'profile'):
            return obj.user.profile.phone
        return ""

    def get_customer_address(self, obj):
        if obj.contact_address:
            return obj.contact_address
        if hasattr(obj.user, 'profile'):
            return obj.user.profile.address
        return ""

    def get_total_amount(self, obj):
        return sum(item.product.price * item.quantity for item in obj.orderitem_set.all())

    def get_total_items(self, obj):
        return sum(item.quantity for item in obj.orderitem_set.all())

    def validate_order_date(self, value):
        # 3 orders per day rule
        if Order.objects.filter(order_date=value).count() >= 3:
            raise serializers.ValidationError(
                "Only 3 orders allowed per day."
            )
        return value




class RegisterSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(required=True, max_length=150, write_only=True)
    phone = serializers.CharField(required=False, allow_blank=True, max_length=30, write_only=True)
    address = serializers.CharField(required=False, allow_blank=True, write_only=True)
    email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(queryset=User.objects.all())]
    )
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ('full_name', 'email', 'phone', 'address', 'password')

    def validate_full_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Full name is required.")
        return value

    def create(self, validated_data):
        email = validated_data['email'].strip().lower()
        full_name = validated_data.pop('full_name').strip()
        phone = validated_data.pop('phone', '').strip()
        address = validated_data.pop('address', '').strip()
        user = User.objects.create_user(
            username=email,
            email=email,
            password=validated_data['password']
        )
        user.first_name = full_name
        user.last_name = ''
        user.save(update_fields=['first_name', 'last_name'])

        profile, _ = Profile.objects.get_or_create(user=user)
        profile.phone = phone
        profile.address = address
        profile.save(update_fields=['phone', 'address'])
        return user


class EmailTokenObtainPairSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get('email', '').strip().lower()
        password = attrs.get('password', '')

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist as exc:
            raise AuthenticationFailed('No active account found with the given credentials') from exc

        authenticated_user = authenticate(username=user.username, password=password)
        if authenticated_user is None or not authenticated_user.is_active:
            raise AuthenticationFailed('No active account found with the given credentials')

        refresh = RefreshToken.for_user(authenticated_user)
        data = {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }
        data['email'] = user.email
        data['full_name'] = user.first_name or user.email
        data['display_name'] = user.first_name or user.email
        profile, created = Profile.objects.get_or_create(user=user)
        data['role'] = profile.role
        data['phone'] = profile.phone
        data['address'] = profile.address
        return data

class CartItemSerializer(serializers.ModelSerializer):
    product_detail = ProductSerializer(source='product', read_only=True)

    class Meta:
        model = CartItem
        fields = ['id', 'product', 'product_detail', 'quantity']


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True, source='cartitem_set')

    class Meta:
        model = Cart
        fields = ['id', 'user', 'items']
        read_only_fields = ['user']


class UserAdminSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source='profile.role')
    phone = serializers.CharField(source='profile.phone', allow_blank=True, required=False)
    address = serializers.CharField(source='profile.address', allow_blank=True, required=False)
    display_name = serializers.SerializerMethodField()
    full_name = serializers.CharField(source='first_name', required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            'id',
            'full_name',
            'display_name',
            'email',
            'phone',
            'address',
            'role',
            'is_active',
            'date_joined',
        ]
        read_only_fields = ['id', 'date_joined']

    def get_display_name(self, obj):
        return obj.first_name or obj.email

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', {})
        full_name = validated_data.pop('first_name', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if full_name is not None:
            instance.first_name = full_name.strip()
            instance.last_name = ''
        instance.username = instance.email
        instance.save()

        profile = instance.profile
        for attr, value in profile_data.items():
            setattr(profile, attr, value)
        profile.save()
        return instance


class AdminDashboardSerializer(serializers.Serializer):
    total_products = serializers.IntegerField()
    total_orders = serializers.IntegerField()
    pending_orders = serializers.IntegerField()
    paid_orders = serializers.IntegerField()
    custom_orders = serializers.IntegerField()
    contact_messages = serializers.IntegerField()
    customers = serializers.IntegerField()


class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = '__all__'
