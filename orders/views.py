import stripe
from django.conf import settings
from rest_framework import status, permissions, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from users.permissions import IsCustomer, IsAdminUser
from cart.models import Cart
from discounts.models import Discount
from catalog.models import ProductVariant
from .models import Order, OrderItem
from .serializers import OrderSerializer

import json
from django.db import transaction
from django.db.models import F

stripe.api_key = getattr(settings, 'STRIPE_SECRET_KEY', 'sk_test_placeholder')

class CheckoutView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsCustomer]

    def post(self, request):
        try:
            cart = Cart.objects.get(user=request.user)
        except Cart.DoesNotExist:
            return Response({"error": "Cart is empty."}, status=status.HTTP_400_BAD_REQUEST)

        active_items = cart.items.filter(variant__product__is_active=True)
        if not active_items.exists():
            return Response({"error": "Cart has no active items."}, status=status.HTTP_400_BAD_REQUEST)

        shipping_address = request.data.get('shipping_address')
        if not shipping_address:
            return Response({"error": "shipping_address is required."}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Validate Stock
        for item in active_items:
            if item.quantity > item.variant.stock_qty:
                return Response({
                    "error": f"Insufficient stock for {item.variant.product.name} ({item.variant.sku}). Available: {item.variant.stock_qty}"
                }, status=status.HTTP_400_BAD_REQUEST)

        # 2. Calculate Subtotal
        subtotal = sum((item.variant.product.base_price + item.variant.price_modifier) * item.quantity for item in active_items)
        discount_code = request.data.get('discount_code')
        discount_amount = 0

        # 3. Apply Discount
        if discount_code:
            try:
                discount = Discount.objects.get(code=discount_code)
                if not discount.is_valid():
                    return Response({"error": "Discount code is expired or inactive."}, status=status.HTTP_400_BAD_REQUEST)
                
                if discount.type == 'percentage':
                    discount_amount = subtotal * (discount.value / 100)
                elif discount.type == 'fixed':
                    discount_amount = discount.value
            except Discount.DoesNotExist:
                return Response({"error": "Invalid discount code."}, status=status.HTTP_400_BAD_REQUEST)

        total = max(0, subtotal - discount_amount)

        # 4. Create Payment Intent
        try:
            intent = stripe.PaymentIntent.create(
                amount=int(total * 100), # Stripe expects cents
                currency='usd',
                metadata={'user_id': request.user.id}
            )
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # 5. Create Pending Order
        with transaction.atomic():
            order = Order.objects.create(
                user=request.user,
                status='pending',
                total=total,
                shipping_address=shipping_address,
                payment_ref=intent.id,
                discount_code=discount_code
            )
            for item in active_items:
                final_unit_price = item.variant.product.base_price + item.variant.price_modifier
                OrderItem.objects.create(
                    order=order,
                    variant=item.variant,
                    quantity=item.quantity,
                    unit_price=final_unit_price
                )

        return Response({
            "client_secret": intent.client_secret,
            "payment_intent_id": intent.id,
            "order_id": order.id,
            "total": str(total),
            "subtotal": str(subtotal),
            "discount_amount": str(discount_amount)
        })

class OrderConfirmationMixin:
    def confirm_order(self, payment_intent_id):
        # Using atomic to prevent race conditions
        with transaction.atomic():
            # select_for_update prevents concurrent stock deductions
            try:
                order = Order.objects.select_for_update().get(payment_ref=payment_intent_id)
            except Order.DoesNotExist:
                return False, "Order not found."
            
            if order.status != 'pending':
                return True, "Order already confirmed." # Idempotent success

            # Deduct stock safely with select_for_update on variants
            for order_item in order.items.all():
                if order_item.variant:
                    # Refresh from db with select_for_update
                    variant = ProductVariant.objects.select_for_update().get(id=order_item.variant.id)
                    if variant.stock_qty < order_item.quantity:
                        # Stock ran out between intent creation and payment
                        # In reality, might need a refund flow here
                        order.status = 'cancelled'
                        order.save()
                        return False, f"Out of stock for {variant.sku}"
                    
                    variant.stock_qty -= order_item.quantity
                    variant.save()
            
            order.status = 'paid'
            order.save()

            # Clear Cart
            try:
                from cart.models import Cart
                cart = Cart.objects.get(user=order.user)
                cart.items.all().delete()
            except Exception:
                pass

            return True, order

class StripeWebhookView(APIView, OrderConfirmationMixin):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
        endpoint_secret = getattr(settings, 'STRIPE_WEBHOOK_SECRET', '')

        if not endpoint_secret:
            return Response({"error": "STRIPE_WEBHOOK_SECRET is not configured."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        try:
            event = stripe.Webhook.construct_event(payload, sig_header, endpoint_secret)
        except ValueError as e:
            return Response({"error": "Invalid payload"}, status=status.HTTP_400_BAD_REQUEST)
        except stripe.error.SignatureVerificationError as e:
            return Response({"error": "Invalid signature"}, status=status.HTTP_400_BAD_REQUEST)

        if event['type'] == 'payment_intent.succeeded':
            payment_intent = event['data']['object']
            success, result = self.confirm_order(payment_intent['id'])
            print(f"WEBHOOK PROCESSING: success={success}, result={result}, intent_id={payment_intent['id']}")
            if not success:
                # Log error, but return 200 so Stripe doesn't retry infinitely
                pass 

        return Response(status=status.HTTP_200_OK)

class OrderViewSet(viewsets.ModelViewSet, OrderConfirmationMixin):
    serializer_class = OrderSerializer
    
    def get_permissions(self):
        if self.request.path.startswith('/api/admin/orders'):
            return [permissions.IsAuthenticated(), IsAdminUser()]
        return [permissions.IsAuthenticated(), IsCustomer()]

    def get_queryset(self):
        if self.request.user.role == 'admin':
            queryset = Order.objects.all()
            status_param = self.request.query_params.get('status')
            if status_param:
                queryset = queryset.filter(status=status_param)
            return queryset
        return Order.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        # Fallback/Status check endpoint for clients
        payment_intent_id = request.data.get('payment_intent_id')

        if not payment_intent_id:
            return Response({"error": "payment_intent_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Verify Payment Intent Status with Stripe
        try:
            intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            if intent.status != 'succeeded':
                return Response({"error": f"Payment intent status is {intent.status}, expected 'succeeded'."}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # 2. Confirm Order (Idempotent)
        success, result = self.confirm_order(payment_intent_id)
        if not success:
            return Response({"error": result}, status=status.HTTP_400_BAD_REQUEST)
            
        order = result if isinstance(result, Order) else Order.objects.get(payment_ref=payment_intent_id)
        serializer = self.get_serializer(order)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['put'], permission_classes=[IsAdminUser])
    def status(self, request, pk=None):
        order = self.get_object()
        new_status = request.data.get('status')
        if new_status not in dict(Order.STATUS_CHOICES):
            return Response({"error": "Invalid status."}, status=status.HTTP_400_BAD_REQUEST)
        
        order.status = new_status
        order.save()
        return Response({"status": order.status})
