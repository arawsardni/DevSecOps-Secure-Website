from decimal import Decimal
from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.response import Response
from order.models import Order
from .models import (
    ShippingProvider, ShippingMethod, ShippingRate,
    Shipment, ShipmentTracking, ShippingConfiguration
)
from .serializers import (
    ShippingProviderListSerializer, ShippingProviderDetailSerializer,
    ShippingMethodSerializer, ShippingMethodListSerializer,
    ShippingRateSerializer, ShipmentListSerializer,
    ShipmentDetailSerializer, CreateShipmentSerializer,
    UpdateShipmentStatusSerializer, ShipmentTrackingSerializer,
    ShippingConfigurationSerializer, ShippingRateCalculationSerializer
)

# ==========================
# Public API Endpoints
# ==========================

@api_view(['GET'])
@permission_classes([AllowAny])
def shipping_providers_list(request):
    """
    Mendapatkan daftar penyedia jasa pengiriman yang aktif
    """
    providers = ShippingProvider.objects.filter(status='active')
    serializer = ShippingProviderListSerializer(providers, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([AllowAny])
def shipping_provider_detail(request, provider_id):
    """
    Mendapatkan detail penyedia jasa pengiriman termasuk metode pengirimannya
    """
    try:
        provider = ShippingProvider.objects.get(id=provider_id, status='active')
        serializer = ShippingProviderDetailSerializer(provider)
        return Response(serializer.data)
    except ShippingProvider.DoesNotExist:
        return Response({'error': 'Penyedia jasa pengiriman tidak ditemukan'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([AllowAny])
def shipping_methods_list(request):
    """
    Mendapatkan daftar metode pengiriman yang aktif
    """
    provider_id = request.query_params.get('provider')
    
    if provider_id:
        methods = ShippingMethod.objects.filter(provider__id=provider_id, status='active')
    else:
        methods = ShippingMethod.objects.filter(status='active')
    
    serializer = ShippingMethodListSerializer(methods, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([AllowAny])
def calculate_shipping_rates(request):
    """
    Menghitung tarif pengiriman berdasarkan asal, tujuan, berat
    """
    serializer = ShippingRateCalculationSerializer(data=request.data)
    
    if serializer.is_valid():
        origin_location = serializer.validated_data.get('origin_location')
        destination_location = serializer.validated_data.get('destination_location')
        weight = serializer.validated_data.get('weight')
        shipping_method_id = serializer.validated_data.get('shipping_method')
        
        # Dapatkan konfigurasi shipping
        config = ShippingConfiguration.get_instance()
        
        # Cek apakah menggunakan flat shipping
        if config.use_flat_shipping:
            return Response({
                'flat_rate': True,
                'shipping_cost': config.flat_shipping_cost
            })
        
        # Query untuk shipping rates
        query = Q(
            origin_location=origin_location,
            destination_location=destination_location,
            is_active=True
        )
        
        # Filter berdasarkan shipping method jika ada
        if shipping_method_id:
            query &= Q(shipping_method_id=shipping_method_id)
        
        # Dapatkan semua rates yang sesuai
        rates = ShippingRate.objects.filter(query)
        
        # Jika tidak ada rates yang ditemukan
        if not rates.exists():
            return Response({'error': 'Tidak ada tarif pengiriman yang tersedia untuk rute ini'}, status=status.HTTP_404_NOT_FOUND)
        
        # Hitung harga untuk setiap rate
        result = []
        for rate in rates:
            calculated_price = rate.calculate_price(weight)
            
            if calculated_price is not None:  # Skip jika berat melebihi maksimum
                result.append({
                    'rate_id': rate.id,
                    'shipping_method_id': rate.shipping_method.id,
                    'shipping_method_name': str(rate.shipping_method),
                    'provider_name': rate.shipping_method.provider.name,
                    'provider_logo': rate.shipping_method.provider.logo.url if rate.shipping_method.provider.logo else None,
                    'method_type': rate.shipping_method.method_type,
                    'method_type_display': rate.shipping_method.get_method_type_display(),
                    'estimated_days': f"{rate.estimated_days_min}-{rate.estimated_days_max} hari",
                    'price': calculated_price,
                    'weight': weight
                })
        
        return Response(result)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# ==========================
# User API Endpoints
# ==========================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_shipments_list(request):
    """
    Mendapatkan daftar pengiriman untuk user yang sedang login
    """
    shipments = Shipment.objects.filter(order__user=request.user).order_by('-created_at')
    serializer = ShipmentListSerializer(shipments, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_shipment_detail(request, shipment_id):
    """
    Mendapatkan detail pengiriman termasuk riwayat tracking
    """
    try:
        shipment = Shipment.objects.get(id=shipment_id, order__user=request.user)
        serializer = ShipmentDetailSerializer(shipment)
        return Response(serializer.data)
    except Shipment.DoesNotExist:
        return Response({'error': 'Pengiriman tidak ditemukan'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def order_shipment_detail(request, order_id):
    """
    Mendapatkan detail pengiriman untuk order tertentu
    """
    try:
        order = Order.objects.get(id=order_id, user=request.user)
        try:
            shipment = Shipment.objects.get(order=order)
            serializer = ShipmentDetailSerializer(shipment)
            return Response(serializer.data)
        except Shipment.DoesNotExist:
            return Response({'error': 'Order ini belum memiliki pengiriman'}, status=status.HTTP_404_NOT_FOUND)
    except Order.DoesNotExist:
        return Response({'error': 'Order tidak ditemukan'}, status=status.HTTP_404_NOT_FOUND)

# ==========================
# Admin API Endpoints
# ==========================

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_shipments_list(request):
    """
    Admin: Mendapatkan daftar semua pengiriman
    """
    status_filter = request.query_params.get('status')
    
    if status_filter:
        shipments = Shipment.objects.filter(status=status_filter).order_by('-created_at')
    else:
        shipments = Shipment.objects.all().order_by('-created_at')
    
    serializer = ShipmentListSerializer(shipments, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_shipment_detail(request, shipment_id):
    """
    Admin: Mendapatkan detail pengiriman
    """
    try:
        shipment = Shipment.objects.get(id=shipment_id)
        serializer = ShipmentDetailSerializer(shipment)
        return Response(serializer.data)
    except Shipment.DoesNotExist:
        return Response({'error': 'Pengiriman tidak ditemukan'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_create_shipment(request):
    """
    Admin: Membuat pengiriman baru
    """
    serializer = CreateShipmentSerializer(data=request.data)
    
    if serializer.is_valid():
        shipment = serializer.save()
        result_serializer = ShipmentDetailSerializer(shipment)
        return Response(result_serializer.data, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT'])
@permission_classes([IsAdminUser])
def admin_update_shipment_status(request, shipment_id):
    """
    Admin: Update status pengiriman
    """
    try:
        shipment = Shipment.objects.get(id=shipment_id)
        serializer = UpdateShipmentStatusSerializer(shipment, data=request.data)
        
        if serializer.is_valid():
            updated_shipment = serializer.save()
            
            # Jika shipment delivered, update order status
            if updated_shipment.status == 'delivered' and updated_shipment.order.status != 'completed':
                order = updated_shipment.order
                order.status = 'completed'
                order.completed_at = updated_shipment.actual_delivery
                order.save()
            
            result_serializer = ShipmentDetailSerializer(updated_shipment)
            return Response(result_serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Shipment.DoesNotExist:
        return Response({'error': 'Pengiriman tidak ditemukan'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_add_tracking(request, shipment_id):
    """
    Admin: Menambahkan update tracking untuk pengiriman
    """
    try:
        shipment = Shipment.objects.get(id=shipment_id)
        
        # Buat tracking baru tanpa mengubah status shipment
        tracking_data = {
            'shipment': shipment,
            'status': request.data.get('status', shipment.status),
            'location': request.data.get('location'),
            'description': request.data.get('description')
        }
        
        tracking = ShipmentTracking.objects.create(**tracking_data)
        serializer = ShipmentTrackingSerializer(tracking)
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    except Shipment.DoesNotExist:
        return Response({'error': 'Pengiriman tidak ditemukan'}, status=status.HTTP_404_NOT_FOUND)

# ==========================
# Shipping Configuration API Endpoints
# ==========================

@api_view(['GET'])
@permission_classes([IsAdminUser])
def shipping_configuration(request):
    """
    Admin: Mendapatkan konfigurasi pengiriman
    """
    config = ShippingConfiguration.get_instance()
    serializer = ShippingConfigurationSerializer(config)
    return Response(serializer.data)

@api_view(['PUT'])
@permission_classes([IsAdminUser])
def update_shipping_configuration(request):
    """
    Admin: Update konfigurasi pengiriman
    """
    config = ShippingConfiguration.get_instance()
    serializer = ShippingConfigurationSerializer(config, data=request.data, partial=True)
    
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# ==========================
# Shipping Methods & Rates API Endpoints (Admin)
# ==========================

@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_create_shipping_provider(request):
    """
    Admin: Membuat penyedia jasa pengiriman baru
    """
    serializer = ShippingProviderDetailSerializer(data=request.data)
    
    if serializer.is_valid():
        provider = serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT'])
@permission_classes([IsAdminUser])
def admin_update_shipping_provider(request, provider_id):
    """
    Admin: Update penyedia jasa pengiriman
    """
    try:
        provider = ShippingProvider.objects.get(id=provider_id)
        serializer = ShippingProviderDetailSerializer(provider, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except ShippingProvider.DoesNotExist:
        return Response({'error': 'Penyedia jasa pengiriman tidak ditemukan'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_create_shipping_method(request):
    """
    Admin: Membuat metode pengiriman baru
    """
    serializer = ShippingMethodSerializer(data=request.data)
    
    if serializer.is_valid():
        method = serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT'])
@permission_classes([IsAdminUser])
def admin_update_shipping_method(request, method_id):
    """
    Admin: Update metode pengiriman
    """
    try:
        method = ShippingMethod.objects.get(id=method_id)
        serializer = ShippingMethodSerializer(method, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except ShippingMethod.DoesNotExist:
        return Response({'error': 'Metode pengiriman tidak ditemukan'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_shipping_rates_list(request):
    """
    Admin: Mendapatkan daftar tarif pengiriman
    """
    method_id = request.query_params.get('method')
    origin_location = request.query_params.get('origin_location')
    destination_location = request.query_params.get('destination_location')
    
    query = Q()
    
    if method_id:
        query &= Q(shipping_method_id=method_id)
    
    if origin_location:
        query &= Q(origin_location=origin_location)
    
    if destination_location:
        query &= Q(destination_location=destination_location)
    
    rates = ShippingRate.objects.filter(query)
    serializer = ShippingRateSerializer(rates, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_create_shipping_rate(request):
    """
    Admin: Membuat tarif pengiriman baru
    """
    serializer = ShippingRateSerializer(data=request.data)
    
    if serializer.is_valid():
        rate = serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT'])
@permission_classes([IsAdminUser])
def admin_update_shipping_rate(request, rate_id):
    """
    Admin: Update tarif pengiriman
    """
    try:
        rate = ShippingRate.objects.get(id=rate_id)
        serializer = ShippingRateSerializer(rate, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except ShippingRate.DoesNotExist:
        return Response({'error': 'Tarif pengiriman tidak ditemukan'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def admin_delete_shipping_rate(request, rate_id):
    """
    Admin: Menghapus tarif pengiriman
    """
    try:
        rate = ShippingRate.objects.get(id=rate_id)
        rate.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    except ShippingRate.DoesNotExist:
        return Response({'error': 'Tarif pengiriman tidak ditemukan'}, status=status.HTTP_404_NOT_FOUND) 