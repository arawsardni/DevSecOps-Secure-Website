from rest_framework import serializers
from .models import Address
from useraccount.serializers import UserSerializer

class AddressSerializer(serializers.ModelSerializer):
    user_detail = UserSerializer(source='user', read_only=True)
    
    class Meta:
        model = Address
        fields = (
            'id', 'user', 'user_detail', 'label', 'address', 'note',
            'coordinates', 'is_default', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

class AddressListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = (
            'id', 'label', 'address', 'is_default'
        )

class CreateAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = (
            'label', 'address', 'note', 'coordinates', 'is_default'
        )
    
    def create(self, validated_data):
        user = self.context['request'].user
        return Address.objects.create(user=user, **validated_data)

class UpdateAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = (
            'label', 'address', 'note', 'coordinates', 'is_default'
        )
        
    def update(self, instance, validated_data):
        # Jika alamat diubah menjadi default, perbarui instance dulu sebelum
        # save() method Address dijalankan agar penanganan default address bekerja dengan benar
        is_default = validated_data.get('is_default', instance.is_default)
        if is_default and not instance.is_default:
            instance.is_default = True
        
        return super().update(instance, validated_data) 