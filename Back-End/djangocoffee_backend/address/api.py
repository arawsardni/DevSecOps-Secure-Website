from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response

from .models import Address, Province, City
from .serializers import (
    AddressSerializer, AddressListSerializer, 
    CreateAddressSerializer, UpdateAddressSerializer,
    ProvinceSerializer, ProvinceListSerializer,
    CitySerializer
)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def address_list(request):
    """
    Mendapatkan daftar alamat pengguna
    """
    addresses = Address.objects.filter(user=request.user)
    serializer = AddressListSerializer(addresses, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def address_detail(request, address_id):
    """
    Mendapatkan detail alamat
    """
    try:
        address = Address.objects.get(id=address_id, user=request.user)
    except Address.DoesNotExist:
        return Response(
            {'error': 'Alamat tidak ditemukan'},
            status=status.HTTP_404_NOT_FOUND
        )
        
    serializer = AddressSerializer(address)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_address(request):
    """
    Membuat alamat baru
    """
    serializer = CreateAddressSerializer(
        data=request.data,
        context={'request': request}
    )
    
    if serializer.is_valid():
        address = serializer.save()
        response_serializer = AddressSerializer(address)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_address(request, address_id):
    """
    Memperbarui alamat
    """
    try:
        address = Address.objects.get(id=address_id, user=request.user)
    except Address.DoesNotExist:
        return Response(
            {'error': 'Alamat tidak ditemukan'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    serializer = UpdateAddressSerializer(address, data=request.data)
    
    if serializer.is_valid():
        updated_address = serializer.save()
        response_serializer = AddressSerializer(updated_address)
        return Response(response_serializer.data)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_address(request, address_id):
    """
    Menghapus alamat
    """
    try:
        address = Address.objects.get(id=address_id, user=request.user)
    except Address.DoesNotExist:
        return Response(
            {'error': 'Alamat tidak ditemukan'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Tidak boleh menghapus alamat default jika alamat lain masih ada
    if address.is_default and Address.objects.filter(user=request.user).count() > 1:
        return Response(
            {'error': 'Tidak dapat menghapus alamat default. Ubah alamat lain menjadi default terlebih dahulu.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    address.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def set_default_address(request, address_id):
    """
    Menjadikan alamat sebagai default
    """
    try:
        address = Address.objects.get(id=address_id, user=request.user)
    except Address.DoesNotExist:
        return Response(
            {'error': 'Alamat tidak ditemukan'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Jika alamat sudah default, tidak perlu melakukan apa-apa
    if address.is_default:
        serializer = AddressSerializer(address)
        return Response(serializer.data)
    
    # Ubah semua alamat lain menjadi non-default
    Address.objects.filter(user=request.user, is_default=True).update(is_default=False)
    
    # Jadikan alamat ini sebagai default
    address.is_default = True
    address.save()
    
    serializer = AddressSerializer(address)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_default_address(request):
    """
    Mendapatkan alamat default pengguna
    """
    try:
        address = Address.objects.get(user=request.user, is_default=True)
        serializer = AddressSerializer(address)
        return Response(serializer.data)
    except Address.DoesNotExist:
        # Jika tidak ada alamat default, coba dapatkan alamat pertama
        addresses = Address.objects.filter(user=request.user).order_by('-created_at')
        if addresses.exists():
            serializer = AddressSerializer(addresses.first())
            return Response(serializer.data)
        
        # Jika tidak ada alamat sama sekali
        return Response(
            {'error': 'Tidak ada alamat yang tersedia'},
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def province_list(request):
    """
    Mendapatkan daftar provinsi
    """
    provinces = Province.objects.all()
    serializer = ProvinceListSerializer(provinces, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def province_detail(request, province_id):
    """
    Mendapatkan detail provinsi dengan kota-kotanya
    """
    try:
        province = Province.objects.get(id=province_id)
    except Province.DoesNotExist:
        return Response(
            {'error': 'Provinsi tidak ditemukan'},
            status=status.HTTP_404_NOT_FOUND
        )
        
    serializer = ProvinceSerializer(province)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def city_list(request, province_id=None):
    """
    Mendapatkan daftar kota, bisa difilter berdasarkan provinsi
    """
    if province_id:
        try:
            province = Province.objects.get(id=province_id)
            cities = City.objects.filter(province=province)
        except Province.DoesNotExist:
            return Response(
                {'error': 'Provinsi tidak ditemukan'},
                status=status.HTTP_404_NOT_FOUND
            )
    else:
        cities = City.objects.all()
    
    serializer = CitySerializer(cities, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def city_detail(request, city_id):
    """
    Mendapatkan detail kota
    """
    try:
        city = City.objects.get(id=city_id)
    except City.DoesNotExist:
        return Response(
            {'error': 'Kota tidak ditemukan'},
            status=status.HTTP_404_NOT_FOUND
        )
        
    serializer = CitySerializer(city)
    return Response(serializer.data)

# Admin API endpoints

@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_create_province(request):
    """
    Membuat provinsi baru (admin only)
    """
    serializer = ProvinceSerializer(data=request.data)
    
    if serializer.is_valid():
        province = serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_create_city(request):
    """
    Membuat kota baru (admin only)
    """
    serializer = CitySerializer(data=request.data)
    
    if serializer.is_valid():
        city = serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT'])
@permission_classes([IsAdminUser])
def admin_update_province(request, province_id):
    """
    Memperbarui provinsi (admin only)
    """
    try:
        province = Province.objects.get(id=province_id)
    except Province.DoesNotExist:
        return Response(
            {'error': 'Provinsi tidak ditemukan'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    serializer = ProvinceSerializer(province, data=request.data)
    
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT'])
@permission_classes([IsAdminUser])
def admin_update_city(request, city_id):
    """
    Memperbarui kota (admin only)
    """
    try:
        city = City.objects.get(id=city_id)
    except City.DoesNotExist:
        return Response(
            {'error': 'Kota tidak ditemukan'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    serializer = CitySerializer(city, data=request.data)
    
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def admin_delete_province(request, province_id):
    """
    Menghapus provinsi (admin only)
    """
    try:
        province = Province.objects.get(id=province_id)
    except Province.DoesNotExist:
        return Response(
            {'error': 'Provinsi tidak ditemukan'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Periksa apakah provinsi memiliki kota
    if province.cities.exists():
        return Response(
            {'error': 'Tidak dapat menghapus provinsi yang memiliki kota. Hapus kota terlebih dahulu.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    province.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def admin_delete_city(request, city_id):
    """
    Menghapus kota (admin only)
    """
    try:
        city = City.objects.get(id=city_id)
    except City.DoesNotExist:
        return Response(
            {'error': 'Kota tidak ditemukan'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Periksa apakah kota digunakan dalam alamat
    if Address.objects.filter(city=city.name).exists():
        return Response(
            {'error': 'Tidak dapat menghapus kota yang digunakan dalam alamat.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    city.delete()
    return Response(status=status.HTTP_204_NO_CONTENT) 