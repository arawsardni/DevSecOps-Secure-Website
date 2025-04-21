from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.core.validators import RegexValidator
import json

User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    phone_number = serializers.CharField(
        required=False,
        validators=[
            RegexValidator(
                regex=r'^\+?1?\d{9,15}$',
                message="Phone number must be entered in the format: '+999999999'"
            )
        ]
    )

    class Meta:
        model = User
        fields = ['id', 'email', 'name', 'password', 'phone_number', 'address', 'preferred_pickup_location']

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            name=validated_data.get('name', ''),
            password=validated_data['password'],
            phone_number=validated_data.get('phone_number', ''),
            address=validated_data.get('address', ''),
            preferred_pickup_location=validated_data.get('preferred_pickup_location', '')
        )
        return user

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

class UserSerializer(serializers.ModelSerializer):
    addresses = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'name', 'phone_number', 'avatar', 'address',
            'user_addresses', 'addresses', 'mainAddress', 
            'preferred_pickup_location', 'points', 'total_spent', 'is_staff',
            'date_joined', 'last_login'
        ]
        read_only_fields = ['points', 'total_spent', 'date_joined', 'last_login']
    
    def get_addresses(self, obj):
        return obj.get_addresses()

    def get_avatar(self, obj):
        if obj.avatar:
            return obj.avatar.url
        return None

class UserUpdateSerializer(serializers.ModelSerializer):
    addresses = serializers.JSONField(required=False, write_only=True)
    avatar = serializers.ImageField(required=False, allow_null=True)
    
    class Meta:
        model = User
        fields = ['name', 'phone_number', 'avatar', 'address', 'user_addresses', 'addresses', 'mainAddress', 'preferred_pickup_location']
    
    def update(self, instance, validated_data):
        addresses = validated_data.pop('addresses', None)
        if addresses is not None:
            instance.user_addresses = json.dumps(addresses)
        
        # Jika ada avatar baru, hapus avatar lama
        if 'avatar' in validated_data and instance.avatar:
            instance.avatar.delete(save=False)
        
        return super().update(instance, validated_data)
