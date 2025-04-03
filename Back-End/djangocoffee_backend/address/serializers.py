from rest_framework import serializers
from .models import Address, Province, City
from useraccount.serializers import UserSerializer

class CitySerializer(serializers.ModelSerializer):
    province_name = serializers.CharField(source='province.name', read_only=True)
    
    class Meta:
        model = City
        fields = ('id', 'name', 'code', 'postal_code', 'province', 'province_name')

class ProvinceSerializer(serializers.ModelSerializer):
    cities = CitySerializer(many=True, read_only=True)
    
    class Meta:
        model = Province
        fields = ('id', 'name', 'code', 'cities')

class ProvinceListSerializer(serializers.ModelSerializer):
    cities_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Province
        fields = ('id', 'name', 'code', 'cities_count')
    
    def get_cities_count(self, obj):
        return obj.cities.count()

class AddressSerializer(serializers.ModelSerializer):
    user_detail = UserSerializer(source='user', read_only=True)
    address_type_display = serializers.CharField(source='get_address_type_display', read_only=True)
    full_address = serializers.CharField(source='get_full_address', read_only=True)
    
    class Meta:
        model = Address
        fields = (
            'id', 'user', 'user_detail', 'address_type', 'address_type_display',
            'recipient_name', 'phone_number', 'address_line1', 'address_line2',
            'city', 'province', 'postal_code', 'label', 'is_default', 'notes',
            'latitude', 'longitude', 'full_address', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

class AddressListSerializer(serializers.ModelSerializer):
    address_type_display = serializers.CharField(source='get_address_type_display', read_only=True)
    full_address = serializers.CharField(source='get_full_address', read_only=True)
    
    class Meta:
        model = Address
        fields = (
            'id', 'address_type', 'address_type_display', 'recipient_name',
            'city', 'province', 'full_address', 'is_default'
        )

class CreateAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = (
            'address_type', 'recipient_name', 'phone_number', 'address_line1',
            'address_line2', 'city', 'province', 'postal_code', 'label',
            'is_default', 'notes', 'latitude', 'longitude'
        )
    
    def create(self, validated_data):
        user = self.context['request'].user
        return Address.objects.create(user=user, **validated_data)

class UpdateAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = (
            'address_type', 'recipient_name', 'phone_number', 'address_line1',
            'address_line2', 'city', 'province', 'postal_code', 'label',
            'is_default', 'notes', 'latitude', 'longitude'
        )
        
    def update(self, instance, validated_data):
        # Jika alamat diubah menjadi default, perbarui instance dulu sebelum
        # save() method Address dijalankan agar penanganan default address bekerja dengan benar
        is_default = validated_data.get('is_default', instance.is_default)
        if is_default and not instance.is_default:
            instance.is_default = True
        
        return super().update(instance, validated_data) 