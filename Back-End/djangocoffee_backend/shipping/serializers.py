from rest_framework import serializers
from address.serializers import CitySerializer, ProvinceSerializer
from .models import (
    ShippingProvider, ShippingMethod, ShippingRate, 
    Shipment, ShipmentTracking, ShippingConfiguration
)

class ShippingProviderListSerializer(serializers.ModelSerializer):
    """Serializer untuk daftar shipping provider"""
    class Meta:
        model = ShippingProvider
        fields = ['id', 'name', 'code', 'logo', 'status']

class ShippingMethodSerializer(serializers.ModelSerializer):
    """Serializer untuk shipping method"""
    provider_name = serializers.SerializerMethodField()
    
    class Meta:
        model = ShippingMethod
        fields = [
            'id', 'provider', 'provider_name', 'name', 'code', 
            'description', 'estimated_delivery_time', 'method_type', 'status'
        ]
    
    def get_provider_name(self, obj):
        return obj.provider.name if obj.provider else None

class ShippingMethodListSerializer(serializers.ModelSerializer):
    """Serializer untuk daftar shipping method"""
    provider_name = serializers.SerializerMethodField()
    method_type_display = serializers.SerializerMethodField()
    
    class Meta:
        model = ShippingMethod
        fields = [
            'id', 'provider_name', 'name', 'code', 
            'method_type', 'method_type_display', 'estimated_delivery_time', 'status'
        ]
    
    def get_provider_name(self, obj):
        return obj.provider.name if obj.provider else None
    
    def get_method_type_display(self, obj):
        return obj.get_method_type_display()

class ShippingProviderDetailSerializer(serializers.ModelSerializer):
    """Serializer detail untuk shipping provider termasuk shipping methods"""
    methods = ShippingMethodListSerializer(many=True, read_only=True)
    
    class Meta:
        model = ShippingProvider
        fields = [
            'id', 'name', 'code', 'logo', 'website', 
            'description', 'status', 'tracking_url_format', 'methods'
        ]

class ShippingRateSerializer(serializers.ModelSerializer):
    """Serializer untuk shipping rate"""
    shipping_method_name = serializers.SerializerMethodField()
    origin_city_name = serializers.SerializerMethodField()
    destination_city_name = serializers.SerializerMethodField()
    
    class Meta:
        model = ShippingRate
        fields = [
            'id', 'shipping_method', 'shipping_method_name',
            'origin_province', 'origin_city', 'origin_city_name',
            'destination_province', 'destination_city', 'destination_city_name',
            'price', 'min_weight', 'max_weight', 'price_per_kg',
            'estimated_days_min', 'estimated_days_max', 'is_active'
        ]
    
    def get_shipping_method_name(self, obj):
        return str(obj.shipping_method) if obj.shipping_method else None
    
    def get_origin_city_name(self, obj):
        return f"{obj.origin_city.name}, {obj.origin_province.name}" if obj.origin_city else None
    
    def get_destination_city_name(self, obj):
        return f"{obj.destination_city.name}, {obj.destination_province.name}" if obj.destination_city else None

class ShipmentTrackingSerializer(serializers.ModelSerializer):
    """Serializer untuk riwayat tracking shipment"""
    status_display = serializers.SerializerMethodField()
    
    class Meta:
        model = ShipmentTracking
        fields = [
            'id', 'status', 'status_display', 'location', 
            'description', 'timestamp'
        ]
    
    def get_status_display(self, obj):
        return obj.get_status_display()

class ShipmentListSerializer(serializers.ModelSerializer):
    """Serializer untuk daftar shipment"""
    order_number = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()
    shipping_method_name = serializers.SerializerMethodField()
    tracking_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Shipment
        fields = [
            'id', 'order', 'order_number', 'shipping_method_name',
            'tracking_number', 'status', 'status_display', 'tracking_url',
            'shipped_at', 'estimated_delivery', 'actual_delivery', 'total_cost'
        ]
    
    def get_order_number(self, obj):
        return obj.order.order_number if obj.order else None
    
    def get_status_display(self, obj):
        return obj.get_status_display()
    
    def get_shipping_method_name(self, obj):
        return str(obj.shipping_method) if obj.shipping_method else None
    
    def get_tracking_url(self, obj):
        return obj.get_tracking_url()

class ShipmentDetailSerializer(serializers.ModelSerializer):
    """Serializer detail untuk shipment termasuk riwayat tracking"""
    order_number = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()
    shipping_method_detail = ShippingMethodSerializer(source='shipping_method', read_only=True)
    tracking_logs = ShipmentTrackingSerializer(many=True, read_only=True)
    tracking_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Shipment
        fields = [
            'id', 'order', 'order_number', 'shipping_method', 'shipping_method_detail',
            'tracking_number', 'tracking_url', 'status', 'status_display', 'notes',
            'shipped_at', 'estimated_delivery', 'actual_delivery',
            'shipping_cost', 'insurance_cost', 'total_cost', 'weight',
            'created_at', 'updated_at', 'tracking_logs'
        ]
    
    def get_order_number(self, obj):
        return obj.order.order_number if obj.order else None
    
    def get_status_display(self, obj):
        return obj.get_status_display()
    
    def get_tracking_url(self, obj):
        return obj.get_tracking_url()

class CreateShipmentSerializer(serializers.ModelSerializer):
    """Serializer untuk membuat shipment baru"""
    class Meta:
        model = Shipment
        fields = [
            'order', 'shipping_method', 'tracking_number', 
            'notes', 'estimated_delivery', 'shipping_cost', 
            'insurance_cost', 'weight'
        ]
    
    def validate_order(self, value):
        """Validasi order belum memiliki shipment"""
        if Shipment.objects.filter(order=value).exists():
            raise serializers.ValidationError("Order ini sudah memiliki shipment")
        return value
    
    def create(self, validated_data):
        # Buat shipment
        shipment = Shipment.objects.create(**validated_data)
        
        # Buat entry tracking awal
        ShipmentTracking.objects.create(
            shipment=shipment,
            status='pending',
            description="Pengiriman telah dibuat dan sedang diproses"
        )
        
        return shipment

class UpdateShipmentStatusSerializer(serializers.ModelSerializer):
    """Serializer untuk update status shipment"""
    location = serializers.CharField(required=False, write_only=True)
    description = serializers.CharField(required=False, write_only=True)
    
    class Meta:
        model = Shipment
        fields = ['status', 'location', 'description']
    
    def update(self, instance, validated_data):
        # Ambil location dan description untuk tracking
        location = validated_data.pop('location', None)
        description = validated_data.pop('description', f"Status diubah menjadi {dict(Shipment.STATUS_CHOICES).get(validated_data.get('status'))}")
        
        # Update timestamp sesuai status
        if validated_data.get('status') == 'in_transit' and not instance.shipped_at:
            validated_data['shipped_at'] = serializers.DateTimeField().to_representation(serializers.DateTimeField().to_internal_value(None))
        
        if validated_data.get('status') == 'delivered' and not instance.actual_delivery:
            validated_data['actual_delivery'] = serializers.DateTimeField().to_representation(serializers.DateTimeField().to_internal_value(None))
        
        # Update shipment
        shipment = super().update(instance, validated_data)
        
        # Buat tracking log
        ShipmentTracking.objects.create(
            shipment=shipment,
            status=shipment.status,
            location=location,
            description=description
        )
        
        return shipment

class ShippingConfigurationSerializer(serializers.ModelSerializer):
    """Serializer untuk konfigurasi pengiriman"""
    default_origin_province_name = serializers.SerializerMethodField()
    default_origin_city_name = serializers.SerializerMethodField()
    
    class Meta:
        model = ShippingConfiguration
        fields = [
            'id', 'default_origin_province', 'default_origin_province_name',
            'default_origin_city', 'default_origin_city_name',
            'min_order_free_shipping', 'flat_shipping_cost',
            'use_flat_shipping', 'default_weight_per_item'
        ]
    
    def get_default_origin_province_name(self, obj):
        return obj.default_origin_province.name if obj.default_origin_province else None
    
    def get_default_origin_city_name(self, obj):
        return obj.default_origin_city.name if obj.default_origin_city else None

class ShippingRateCalculationSerializer(serializers.Serializer):
    """Serializer untuk kalkulasi shipping rate"""
    origin_city = serializers.UUIDField(required=False)
    destination_city = serializers.UUIDField(required=True)
    weight = serializers.DecimalField(max_digits=6, decimal_places=2, required=True)
    shipping_method = serializers.UUIDField(required=False)
    
    def validate(self, data):
        # Jika origin_city tidak ada, gunakan default dari konfigurasi
        if not data.get('origin_city'):
            config = ShippingConfiguration.get_instance()
            if not config.default_origin_city:
                raise serializers.ValidationError({"origin_city": "Kota asal tidak ditemukan"})
            data['origin_city'] = config.default_origin_city.id
        
        return data 