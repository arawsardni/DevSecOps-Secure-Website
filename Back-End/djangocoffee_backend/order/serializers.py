from rest_framework import serializers
from .models import Order, OrderItem, OrderPayment, OrderTracking
from product.serializers import ProductDetailSerializer
from address.serializers import AddressSerializer
from django.db import transaction

class OrderItemSerializer(serializers.ModelSerializer):
    product_detail = ProductDetailSerializer(source='product', read_only=True)
    total_price = serializers.SerializerMethodField()
    
    class Meta:
        model = OrderItem
        fields = ('id', 'product', 'product_detail', 'quantity', 'price', 
                 'size', 'special_instructions', 'total_price')
    
    def get_total_price(self, obj):
        return obj.get_total_price()

class OrderPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderPayment
        fields = ('id', 'payment_method', 'amount', 'transaction_id', 
                 'payment_date', 'is_paid')
        read_only_fields = ('id', 'payment_date')

class OrderTrackingSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    updated_by_email = serializers.CharField(source='updated_by.email', read_only=True)
    
    class Meta:
        model = OrderTracking
        fields = ('id', 'status', 'status_display', 'timestamp', 'note', 
                 'updated_by', 'updated_by_email')
        read_only_fields = ('id', 'timestamp')

class OrderDetailSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    payment = OrderPaymentSerializer(read_only=True)
    tracking = OrderTrackingSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_status_display = serializers.CharField(source='get_payment_status_display', read_only=True)
    delivery_method_display = serializers.CharField(source='get_delivery_method_display', read_only=True)
    total_items = serializers.SerializerMethodField()
    subtotal = serializers.SerializerMethodField()
    total_with_delivery = serializers.SerializerMethodField()
    final_total = serializers.SerializerMethodField()
    delivery_address_detail = AddressSerializer(source='delivery_address', read_only=True)
    
    class Meta:
        model = Order
        fields = (
            'id', 'order_number', 'user', 'status', 'status_display', 
            'payment_status', 'payment_status_display', 'delivery_method', 
            'delivery_method_display', 'delivery_address', 'delivery_address_detail', 'delivery_fee',
            'delivery_notes', 'pickup_location', 'pickup_time',
            'special_instructions', 'estimated_delivery_time',
            'points_earned', 'points_used', 'discount_amount',
            'created_at', 'updated_at', 'completed_at',
            'items', 'payment', 'tracking',
            'total_items', 'subtotal', 'total_with_delivery', 'final_total'
        )
        read_only_fields = (
            'id', 'order_number', 'created_at', 'updated_at', 
            'completed_at', 'points_earned'
        )
    
    def get_total_items(self, obj):
        return obj.get_total_items_count()
    
    def get_subtotal(self, obj):
        return obj.get_subtotal()
    
    def get_total_with_delivery(self, obj):
        return obj.get_total_with_delivery()
    
    def get_final_total(self, obj):
        return obj.get_final_total()

class OrderListSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_status_display = serializers.CharField(source='get_payment_status_display', read_only=True)
    delivery_method_display = serializers.CharField(source='get_delivery_method_display', read_only=True)
    total_items = serializers.SerializerMethodField()
    payment_method = serializers.SerializerMethodField()
    payment_method_display = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = (
            'id', 'order_number', 'status', 'status_display', 
            'payment_status', 'payment_status_display',
            'delivery_method', 'delivery_method_display',
            'total_amount', 'created_at', 'total_items',
            'payment_method', 'payment_method_display'
        )
    
    def get_total_items(self, obj):
        return obj.get_total_items_count()
        
    def get_payment_method(self, obj):
        try:
            if hasattr(obj, 'payment') and obj.payment:
                return obj.payment.payment_method
            return None
        except Exception as e:
            return None
            
    def get_payment_method_display(self, obj):
        try:
            if hasattr(obj, 'payment') and obj.payment:
                payment_methods = dict(OrderPayment.PAYMENT_METHOD_CHOICES)
                return payment_methods.get(obj.payment.payment_method, None)
            return None
        except Exception as e:
            return None

class CreateOrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ('product', 'quantity', 'size', 'special_instructions')

class CreateOrderSerializer(serializers.ModelSerializer):
    items = CreateOrderItemSerializer(many=True)
    payment_method = serializers.ChoiceField(choices=OrderPayment.PAYMENT_METHOD_CHOICES)
    
    class Meta:
        model = Order
        fields = (
            'delivery_method', 'delivery_address', 'delivery_notes',
            'pickup_location', 'pickup_time', 'special_instructions',
            'points_used', 'items', 'payment_method'
        )
    
    def validate_points_used(self, value):
        user = self.context['request'].user
        if value > user.points:
            raise serializers.ValidationError("Anda tidak memiliki cukup poin")
        return value
    
    def validate(self, data):
        # Validasi untuk delivery
        if data.get('delivery_method') == 'delivery' and not data.get('delivery_address'):
            raise serializers.ValidationError({"delivery_address": "Alamat pengiriman diperlukan untuk metode antar"})
        
        # Validasi untuk pickup
        if data.get('delivery_method') == 'pickup' and not data.get('pickup_location'):
            raise serializers.ValidationError({"pickup_location": "Lokasi pickup diperlukan untuk metode ambil sendiri"})
            
        return data
    
    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop('items')
        payment_method = validated_data.pop('payment_method')
        
        # Menghitung total amount dan validasi stok
        total_amount = 0
        for item_data in items_data:
            product = item_data['product']
            quantity = int(item_data['quantity'])  # Ensure quantity is an integer
            
            # Validasi stok
            if product.stock < quantity:
                raise serializers.ValidationError(
                    f"Stok tidak cukup untuk {product.name}. Tersedia: {product.stock}"
                )
            
            # Tambahkan ke total - ensure both are correct types
            total_amount += product.price * quantity
        
        # Tambahkan biaya pengiriman jika delivery
        delivery_fee = 0
        if validated_data.get('delivery_method') == 'delivery':
            delivery_fee = 10000  # Biaya pengiriman tetap (bisa diubah)
            total_amount += delivery_fee
        
        # Hitung diskon dari poin
        points_used = validated_data.pop('points_used', 0)  # Pop to avoid duplicate
        discount_amount = points_used // 10  # 10 poin = 1000 rupiah
        total_amount -= discount_amount
        
        # Pastikan total tidak negatif
        total_amount = max(total_amount, 0)
        
        # Hitung poin yang didapat (1% dari total belanja)
        # Convert to integer first to avoid Decimal * float issue
        points_earned = int(float(total_amount) * 0.01)
        
        # Buat order
        order = Order.objects.create(
            user=self.context['request'].user,
            total_amount=total_amount,
            delivery_fee=delivery_fee,
            points_earned=points_earned,
            points_used=points_used,
            discount_amount=discount_amount,
            **validated_data
        )
        
        # Buat order items dan kurangi stok
        for item_data in items_data:
            product = item_data['product']
            quantity = int(item_data['quantity'])  # Ensure quantity is an integer
            
            # Buat order item
            OrderItem.objects.create(
                order=order,
                product=product,
                price=product.price,
                quantity=quantity,  # Use the converted integer quantity
                size=item_data.get('size'),
                special_instructions=item_data.get('special_instructions', '')
            )
            
            # Kurangi stok
            product.stock -= quantity
            product.total_sold += quantity
            product.save()
        
        # Buat payment record
        OrderPayment.objects.create(
            order=order,
            payment_method=payment_method,
            amount=total_amount,
            is_paid=False  # Default belum dibayar
        )
        
        # Tambahkan tracking
        OrderTracking.objects.create(
            order=order,
            status='new',
            note='Pesanan dibuat'
        )
        
        return order 