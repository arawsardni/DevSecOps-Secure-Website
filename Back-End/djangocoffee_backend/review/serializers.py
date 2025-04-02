from rest_framework import serializers
from django.db import transaction
from .models import Review, ReviewLike, ReviewImage
from product.serializers import ProductDetailSerializer
from useraccount.serializers import UserSerializer

class ReviewImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = ReviewImage
        fields = ('id', 'image', 'image_url', 'created_at')
        read_only_fields = ('id', 'created_at')
    
    def get_image_url(self, obj):
        if obj.image:
            return obj.image.url
        return None

class ReviewSerializer(serializers.ModelSerializer):
    user_detail = UserSerializer(source='user', read_only=True)
    product_detail = ProductDetailSerializer(source='product', read_only=True)
    images = ReviewImageSerializer(many=True, read_only=True)
    rating_display = serializers.CharField(source='get_rating_display', read_only=True)
    is_liked_by_user = serializers.SerializerMethodField()
    
    class Meta:
        model = Review
        fields = (
            'id', 'user', 'user_detail', 'product', 'product_detail',
            'rating', 'rating_display', 'comment', 'is_approved',
            'is_featured', 'likes_count', 'is_liked_by_user',
            'images', 'created_at', 'updated_at'
        )
        read_only_fields = (
            'id', 'is_approved', 'is_featured', 
            'likes_count', 'created_at', 'updated_at'
        )
    
    def get_is_liked_by_user(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return ReviewLike.objects.filter(review=obj, user=request.user).exists()
        return False

class CreateReviewSerializer(serializers.ModelSerializer):
    images = serializers.ListField(
        child=serializers.ImageField(),
        required=False,
        write_only=True
    )
    
    class Meta:
        model = Review
        fields = ('product', 'rating', 'comment', 'images')
    
    def validate_product(self, value):
        user = self.context['request'].user
        
        # Verifikasi apakah pengguna sudah memberikan review untuk produk ini
        if Review.objects.filter(user=user, product=value).exists():
            raise serializers.ValidationError("Anda sudah memberikan review untuk produk ini")
        
        return value
    
    @transaction.atomic
    def create(self, validated_data):
        images_data = validated_data.pop('images', [])
        user = self.context['request'].user
        
        review = Review.objects.create(
            user=user,
            **validated_data
        )
        
        # Buat ReviewImage untuk setiap gambar yang diupload
        for image_data in images_data:
            ReviewImage.objects.create(review=review, image=image_data)
        
        return review

class ReviewLikeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReviewLike
        fields = ('id', 'review', 'user', 'created_at')
        read_only_fields = ('id', 'user', 'created_at')
    
    def validate_review(self, value):
        user = self.context['request'].user
        
        # Verifikasi apakah pengguna sudah menyukai review ini
        if ReviewLike.objects.filter(user=user, review=value).exists():
            raise serializers.ValidationError("Anda sudah menyukai review ini")
        
        return value
    
    def create(self, validated_data):
        user = self.context['request'].user
        return ReviewLike.objects.create(
            user=user,
            **validated_data
        ) 