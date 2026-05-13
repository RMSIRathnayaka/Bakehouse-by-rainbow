from datetime import date, timedelta

from django.contrib.auth.models import User
from django.db.models import Count
from rest_framework import generics, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny, BasePermission, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView

from .chatbot import build_response
from .models import Cart, CartItem, ContactMessage, CustomCake, Order, OrderItem, Product, Profile
from .serializers import (
    CartSerializer,
    ContactMessageSerializer,
    CustomCakeSerializer,
    EmailTokenObtainPairSerializer,
    OrderSerializer,
    ProductSerializer,
    RegisterSerializer,
    UserAdminSerializer,
)


def get_user_profile(user):
    profile, _ = Profile.objects.get_or_create(user=user)
    return profile


def get_user_role(user):
    if not user or not user.is_authenticated:
        return None
    return get_user_profile(user).role


class IsAdminRole(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and get_user_role(request.user) == 'admin'
        )


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAdminRole()]


class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            Order.objects.filter(user=self.request.user)
            .select_related('user', 'user__profile')
            .prefetch_related('orderitem_set__product')
            .order_by('-created_at')
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def available_dates(self, request):
        today = date.today()
        days = []

        for i in range(14):
            current_date = today + timedelta(days=i)
            count = Order.objects.filter(delivery_date=current_date).count()
            days.append({
                "date": current_date,
                "available": count < 3,
                "orders": count,
            })

        return Response(days)

    @action(detail=False, methods=['post'])
    def checkout(self, request):
        user = request.user
        profile = get_user_profile(user)
        cart, _ = Cart.objects.get_or_create(user=user)

        if not cart.cartitem_set.exists():
            return Response({"error": "Cart is empty"}, status=status.HTTP_400_BAD_REQUEST)

        delivery_date = request.data.get('delivery_date')
        payment_method = request.data.get('payment_method') or 'cod'
        contact_name = (request.data.get('contact_name') or user.first_name or user.email).strip()
        contact_phone = (request.data.get('contact_phone') or profile.phone).strip()
        contact_address = (request.data.get('contact_address') or profile.address).strip()
        notes = (request.data.get('notes') or '').strip()

        if payment_method not in dict(Order.PAYMENT_CHOICES):
            return Response({"error": "Invalid payment method"}, status=status.HTTP_400_BAD_REQUEST)

        if not delivery_date:
            return Response({"error": "Delivery date is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            parsed_delivery_date = date.fromisoformat(delivery_date)
        except ValueError:
            return Response({"error": "Invalid delivery date format"}, status=status.HTTP_400_BAD_REQUEST)

        if parsed_delivery_date < date.today() + timedelta(days=2):
            return Response(
                {"error": "Orders must be placed at least 2 days in advance"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if Order.objects.filter(delivery_date=parsed_delivery_date).count() >= 3:
            return Response(
                {"error": "Selected delivery date is fully booked"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not contact_name:
            return Response({"error": "Contact name is required"}, status=status.HTTP_400_BAD_REQUEST)

        if not contact_phone:
            return Response({"error": "Contact phone is required"}, status=status.HTTP_400_BAD_REQUEST)

        if not contact_address:
            return Response({"error": "Contact address is required"}, status=status.HTTP_400_BAD_REQUEST)

        order = Order.objects.create(
            user=user,
            contact_name=contact_name,
            contact_phone=contact_phone,
            contact_address=contact_address,
            notes=notes,
            delivery_date=parsed_delivery_date,
            payment_method=payment_method,
            payment_status='success' if payment_method == 'online' else 'pending',
        )

        for item in cart.cartitem_set.select_related('product').all():
            OrderItem.objects.create(
                order=order,
                product=item.product,
                quantity=item.quantity,
            )

        cart.cartitem_set.all().delete()

        return Response(self.get_serializer(order).data, status=status.HTTP_201_CREATED)


class CartViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        serializer = CartSerializer(cart)
        return Response(serializer.data)

    def create(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        product_id = request.data.get('product')
        quantity = int(request.data.get('quantity', 1))

        cart_item, created = CartItem.objects.get_or_create(
            cart=cart,
            product_id=product_id,
        )

        if not created:
            cart_item.quantity += quantity
        else:
            cart_item.quantity = quantity

        cart_item.save()
        return Response({"message": "Item added to cart"}, status=status.HTTP_201_CREATED)

    def destroy(self, request, pk=None):
        try:
            cart_item = CartItem.objects.get(id=pk, cart__user=request.user)
        except CartItem.DoesNotExist:
            return Response({"error": "Item not found"}, status=status.HTTP_404_NOT_FOUND)

        cart_item.delete()
        return Response({"message": "Item removed"})


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_profile(request):
    profile = get_user_profile(request.user)
    return Response({
        "username": request.user.username,
        "full_name": request.user.first_name or request.user.email,
        "display_name": request.user.first_name or request.user.email,
        "email": request.user.email,
        "phone": profile.phone,
        "address": profile.address,
        "role": profile.role,
    })


class EmailTokenObtainPairView(TokenObtainPairView):
    serializer_class = EmailTokenObtainPairSerializer


@api_view(['POST'])
@permission_classes([AllowAny])
def chatbot_reply(request):
    message = (request.data.get('message') or '').strip()

    if len(message) > 500:
        return Response(
            {"error": "Message is too long. Please keep it under 500 characters."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response(build_response(message))


class CustomCakeViewSet(viewsets.ModelViewSet):
    serializer_class = CustomCakeSerializer

    def get_permissions(self):
        if self.action == 'booked_dates':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = CustomCake.objects.select_related('user', 'user__profile').order_by('-created_at')
        if get_user_role(self.request.user) == 'admin':
            return queryset
        return queryset.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        profile = get_user_profile(request.user)
        delivery_date = request.data.get('delivery_date')
        contact_name = (request.data.get('contact_name') or request.user.first_name or request.user.email).strip()
        contact_phone = (request.data.get('contact_phone') or profile.phone).strip()
        contact_address = (request.data.get('contact_address') or profile.address).strip()

        if not delivery_date:
            return Response({"error": "Delivery date is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            parsed_delivery_date = date.fromisoformat(delivery_date)
        except ValueError:
            return Response({"error": "Invalid delivery date format"}, status=status.HTTP_400_BAD_REQUEST)

        if parsed_delivery_date < date.today() + timedelta(days=2):
            return Response(
                {"error": "Orders must be placed at least 2 days in advance"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if CustomCake.objects.filter(delivery_date=parsed_delivery_date).count() >= 3:
            return Response(
                {"error": "This date is fully booked. Please select another date."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not contact_name:
            return Response({"error": "Contact name is required"}, status=status.HTTP_400_BAD_REQUEST)

        if not contact_phone:
            return Response({"error": "Contact phone is required"}, status=status.HTTP_400_BAD_REQUEST)

        if not contact_address:
            return Response({"error": "Contact address is required"}, status=status.HTTP_400_BAD_REQUEST)

        payload = request.data.copy()
        payload['contact_name'] = contact_name
        payload['contact_phone'] = contact_phone
        payload['contact_address'] = contact_address
        payload['delivery_date'] = parsed_delivery_date.isoformat()

        serializer = self.get_serializer(data=payload)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def booked_dates(self, request):
        dates = (
            CustomCake.objects.values('delivery_date')
            .annotate(total=Count('id'))
            .filter(total__gte=3)
        )
        booked = [item['delivery_date'] for item in dates]
        return Response(booked)


class ContactMessageViewSet(viewsets.ModelViewSet):
    queryset = ContactMessage.objects.all().order_by('-created_at')
    serializer_class = ContactMessageSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]
        return [IsAdminRole()]


class AdminDashboardViewSet(viewsets.ViewSet):
    permission_classes = [IsAdminRole]

    def list(self, request):
        data = {
            'total_products': Product.objects.count(),
            'total_orders': Order.objects.count(),
            'pending_orders': Order.objects.filter(status='pending').count(),
            'paid_orders': Order.objects.filter(payment_status='success').count(),
            'custom_orders': CustomCake.objects.count(),
            'contact_messages': ContactMessage.objects.filter(status='new').count(),
            'customers': User.objects.filter(profile__role='customer').count(),
        }
        return Response(data)


class AdminUserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.select_related('profile').all().order_by('-date_joined')
    serializer_class = UserAdminSerializer
    permission_classes = [IsAdminRole]
    http_method_names = ['get', 'patch', 'head', 'options']


class AdminOrderViewSet(viewsets.ModelViewSet):
    queryset = (
        Order.objects.select_related('user', 'user__profile')
        .prefetch_related('orderitem_set__product')
        .all()
        .order_by('-created_at')
    )
    serializer_class = OrderSerializer
    permission_classes = [IsAdminRole]
    http_method_names = ['get', 'patch', 'head', 'options']


class AdminCustomCakeViewSet(viewsets.ModelViewSet):
    queryset = CustomCake.objects.select_related('user', 'user__profile').all().order_by('-created_at')
    serializer_class = CustomCakeSerializer
    permission_classes = [IsAdminRole]
    http_method_names = ['get', 'patch', 'head', 'options']
