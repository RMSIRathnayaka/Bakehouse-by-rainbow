from rest_framework import viewsets, generics, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.decorators import action
from django.contrib.auth.models import User
from datetime import date, timedelta
from .models import CustomCake
from .serializers import CustomCakeSerializer
from django.utils.dateparse import parse_date
from django.db.models import Count
from rest_framework.decorators import api_view
from .models import Profile
from rest_framework.decorators import permission_classes

from .models import Product, Order, OrderItem, Cart, CartItem
from .serializers import (
    ProductSerializer,
    OrderSerializer,
    RegisterSerializer,
    CartSerializer
)


# ==============================
# PRODUCTS
# ==============================
class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]


# ==============================
# ORDERS
# ==============================
class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    # ==========================
    # AVAILABLE DELIVERY DATES
    # ==========================
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
                "orders": count
            })

        return Response(days)

    # ==========================
    # CHECKOUT (UPDATED)
    # ==========================
    @action(detail=False, methods=['post'])
    def checkout(self, request):
        user = request.user
        cart, created = Cart.objects.get_or_create(user=user)

        if not cart.cartitem_set.exists():
            return Response({"error": "Cart is empty"}, status=400)

        delivery_date = request.data.get('delivery_date')
        payment_method = request.data.get('payment_method')

        # 🔴 VALIDATION: delivery date required
        if not delivery_date:
            return Response(
                {"error": "Delivery date is required"},
                status=400
            )

        # Convert string → date
        try:
            delivery_date = date.fromisoformat(delivery_date)
        except ValueError:
            return Response(
                {"error": "Invalid delivery date format"},
                status=400
            )

        # 🔥 RULE 1: Minimum 2 days
        if delivery_date < date.today() + timedelta(days=2):
            return Response(
                {"error": "Orders must be placed at least 2 days in advance"},
                status=400
            )

        # 🔥 RULE 2: Max 3 orders per day
        count = Order.objects.filter(delivery_date=delivery_date).count()
        if count >= 3:
            return Response(
                {"error": "Selected delivery date is fully booked"},
                status=400
            )

        # ✅ CREATE ORDER
        order = Order.objects.create(
            user=user,
            delivery_date=delivery_date,
            payment_method=payment_method
        )

        # ADD ITEMS
        for item in cart.cartitem_set.all():
            OrderItem.objects.create(
                order=order,
                product=item.product,
                quantity=item.quantity
            )

        # CLEAR CART
        cart.cartitem_set.all().delete()

        return Response(
            {"message": "Order placed successfully"},
            status=status.HTTP_201_CREATED
        )


# ==============================
# CART
# ==============================
class CartViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        cart, created = Cart.objects.get_or_create(user=request.user)
        serializer = CartSerializer(cart)
        return Response(serializer.data)

    def create(self, request):
        cart, created = Cart.objects.get_or_create(user=request.user)

        product_id = request.data.get('product')
        quantity = int(request.data.get('quantity', 1))

        cart_item, created = CartItem.objects.get_or_create(
            cart=cart,
            product_id=product_id
        )

        if not created:
            cart_item.quantity += quantity
        else:
            cart_item.quantity = quantity

        cart_item.save()

        return Response({"message": "Item added to cart"}, status=201)

    def destroy(self, request, pk=None):
        try:
            cart_item = CartItem.objects.get(id=pk, cart__user=request.user)
            cart_item.delete()
            return Response({"message": "Item removed"})
        except CartItem.DoesNotExist:
            return Response({"error": "Item not found"}, status=404)


# ==============================
# REGISTER (UPDATED)
# ==============================
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)

        user = User.objects.get(username=request.data.get("username"))

        # Save phone to profile
        phone = request.data.get("phone", "")
        profile, created = Profile.objects.get_or_create(user=user)
        profile.phone = phone
        profile.save()

        return response


# ==============================
# PROFILE API (NEW)
# ==============================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_profile(request):
    profile = request.user.profile

    return Response({
        "username": request.user.username,
        "email": request.user.email,
        "phone": profile.phone
    })


# ==============================
# CUSTOM CAKE
# ==============================
class CustomCakeViewSet(viewsets.ModelViewSet):
    queryset = CustomCake.objects.all()
    serializer_class = CustomCakeSerializer

    def create(self, request, *args, **kwargs):
        delivery_date = request.data.get('delivery_date')

        if not delivery_date:
            return Response(
                {"error": "Delivery date is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        count = CustomCake.objects.filter(delivery_date=delivery_date).count()

        if count >= 3:
            return Response(
                {"error": "This date is fully booked. Please select another date."},
                status=status.HTTP_400_BAD_REQUEST
            )

        return super().create(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def booked_dates(self, request):
        dates = (
            CustomCake.objects
            .values('delivery_date')
            .annotate(total=Count('id'))
            .filter(total__gte=3)
        )

        booked = [item['delivery_date'] for item in dates]

        return Response(booked)