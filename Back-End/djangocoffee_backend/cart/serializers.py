from rest_framework import serializers
from .models import Cart, CartItem
from product.serializers import ProductDetailSerializer

class CartItemSerializer(serializers.ModelSerializer):
    product_detail = ProductDetailSerializer(source='product', read_only=True)
    total_price = serializers.SerializerMethodField()
    
    class Meta:
        model = CartItem
        fields = ('id', 'product', 'product_detail', 'quantity', 'size', 
                 'special_instructions', 'total_price', 'created_at')
        read_only_fields = ('id', 'created_at')
    
    def get_total_price(self, obj):
        return obj.get_total_price()

class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total = serializers.SerializerMethodField()
    items_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Cart
        fields = ('id', 'user', 'is_active', 'items', 'total', 'items_count', 'created_at')
        read_only_fields = ('id', 'user', 'created_at')
    
    def get_total(self, obj):
        return obj.get_cart_total()
    
    def get_items_count(self, obj):
        return obj.get_cart_items_count()

class AddToCartSerializer(serializers.Serializer):
    product_id = serializers.UUIDField()
    quantity = serializers.IntegerField(min_value=1, default=1)
    size = serializers.ChoiceField(choices=CartItem._meta.get_field('size').choices, allow_blank=True, allow_null=True)
    special_instructions = serializers.CharField(allow_blank=True, required=False)

class UpdateCartItemSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=1)
    special_instructions = serializers.CharField(allow_blank=True, required=False) 