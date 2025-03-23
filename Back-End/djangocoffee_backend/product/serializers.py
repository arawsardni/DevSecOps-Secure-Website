from rest_framework import serializers

from .models import Product

class ProductListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = (
            'id', 
            'name', 
            'price',
            'rating',
            'image_url',
            )
        
class ProductDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = (
            'id', 
            'name', 
            'price',
            'rating',
            'image_url',
            'description',
            )