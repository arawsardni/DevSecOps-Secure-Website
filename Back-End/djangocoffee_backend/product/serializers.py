from rest_framework import serializers
from .models import Product, Category

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'is_active']

class ProductListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    image_url = serializers.SerializerMethodField()
    
    def get_image_url(self, obj):
        return obj.image_url()
    
    class Meta:
        model = Product
        fields = (
            'id', 
            'name', 
            'price',
            'size',
            'rating',
            'image_url',
            'category_name',
            'is_available',
            'is_featured',
            'is_bestseller',
            'preparation_time',
            'total_sold'
        )
        
class ProductDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    image_url = serializers.SerializerMethodField()
    
    def get_image_url(self, obj):
        return obj.image_url()
    
    class Meta:
        model = Product
        fields = (
            'id', 
            'name', 
            'price',
            'size',
            'rating',
            'image_url',
            'description',
            'category',
            'is_available',
            'is_featured',
            'is_bestseller',
            'stock',
            'calories',
            'preparation_time',
            'total_sold',
            'created_at',
            'updated_at'
        )
        read_only_fields = ['rating', 'total_sold', 'created_at', 'updated_at']

class ProductCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = (
            'name', 
            'price',
            'size',
            'description',
            'category',
            'image',
            'is_available',
            'is_featured',
            'is_bestseller',
            'stock',
            'calories',
            'preparation_time'
        )