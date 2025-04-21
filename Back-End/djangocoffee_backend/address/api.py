from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
import logging
import json
import traceback

from .models import Address
from .serializers import (
    AddressSerializer, AddressListSerializer, 
    CreateAddressSerializer, UpdateAddressSerializer
)

# Set up logger
logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def address_list(request):
    """
    Mendapatkan daftar alamat pengguna
    """
    user_id = request.user.id
    logger.info(f"User {user_id} requested address list")
    
    addresses = Address.objects.filter(user=request.user)
    logger.info(f"Found {addresses.count()} addresses for user {user_id}")
    
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
    user_id = request.user.id
    user_email = request.user.email
    logger.info(f"User {user_id} ({user_email}) is creating an address")
    
    # Log model metadata
    logger.info(f"Address model DB table: {Address._meta.db_table}")
    logger.info(f"Address model fields: {[f.name for f in Address._meta.get_fields()]}")
    
    try:
        # Log raw request data
        logger.debug(f"Raw request data: {request.data}")
        request_data_str = json.dumps(request.data, ensure_ascii=False, default=str)
        logger.info(f"Create address request data: {request_data_str}")
        
        # Debug database query
        from django.db import connection
        logger.info(f"Database engine: {connection.vendor}")
        logger.info(f"Database name: {connection.settings_dict['NAME']}")
        
        # Log all address-related tables
        cursor = connection.cursor()
        try:
            # Periksa apakah menggunakan PostgreSQL
            if connection.vendor == 'postgresql':
                cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_name LIKE '%address%';")
                tables = cursor.fetchall()
                logger.info(f"Address-related tables: {tables}")
                
                # Get schema for each table
                for table in tables:
                    table_name = table[0]
                    cursor.execute(f"SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = '{table_name}';")
                    columns = cursor.fetchall()
                    logger.info(f"Table {table_name} columns: {columns}")
            else:
                # Untuk SQLite
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%address%';")
                tables = cursor.fetchall()
                logger.info(f"Address-related tables: {tables}")
                
                # Get schema for each table
                for table in tables:
                    table_name = table[0]
                    cursor.execute(f"PRAGMA table_info({table_name});")
                    columns = cursor.fetchall()
                    logger.info(f"Table {table_name} columns: {columns}")
            
        except Exception as e:
            logger.error(f"Error getting table info: {str(e)}")
            
    except Exception as e:
        logger.warning(f"Could not log request data: {str(e)}")
    
    serializer = CreateAddressSerializer(
        data=request.data,
        context={'request': request}
    )
    
    if serializer.is_valid():
        try:
            # Simpan alamat dengan eksplisit menyediakan user
            address_data = serializer.validated_data
            user = request.user
            
            # Log informasi untuk debugging
            logger.info(f"Valid data: {address_data}")
            logger.info(f"User: {user.id} - {user.email}")
            
            # Buat alamat secara langsung dari model untuk memastikan save() method dipanggil
            address = Address.objects.create(
                user=user,
                label=address_data.get('label', ''),
                address=address_data.get('address', ''),
                note=address_data.get('note', ''),
                coordinates=address_data.get('coordinates', ''),
                is_default=address_data.get('is_default', False),
                # Tambahkan field wajib dengan nilai default
                recipient_name='',
                phone_number='',
                address_line1='',
                address_line2='',
                city='',
                province='',
                postal_code=''
            )
            
            # Debug SQL query
            from django.db import connection
            logger.info(f"Last SQL query: {connection.queries[-1]['sql'] if connection.queries else 'No queries'}")
            
            # Log alamat yang berhasil dibuat
            logger.info(f"Created address with ID: {address.id} for user {user.id}")
            
            response_serializer = AddressSerializer(address)
            response_data = response_serializer.data
            
            # Log response untuk debugging
            try:
                logger.debug(f"Response data: {json.dumps(response_data, ensure_ascii=False, default=str)}")
            except Exception as e:
                logger.warning(f"Could not log response data: {str(e)}")
                
            return Response(response_data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Error creating address: {str(e)}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            return Response(
                {'error': f'Gagal membuat alamat: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    logger.warning(f"Invalid data: {serializer.errors}")
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_address(request, address_id):
    """
    Memperbarui alamat
    """
    user_id = request.user.id
    logger.info(f"User {user_id} updating address {address_id}")
    
    try:
        address = Address.objects.get(id=address_id, user=request.user)
    except Address.DoesNotExist:
        logger.warning(f"Address {address_id} not found for user {user_id}")
        return Response(
            {'error': 'Alamat tidak ditemukan'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    serializer = UpdateAddressSerializer(address, data=request.data)
    
    if serializer.is_valid():
        updated_address = serializer.save()
        logger.info(f"Address {address_id} successfully updated by user {user_id}")
        response_serializer = AddressSerializer(updated_address)
        return Response(response_serializer.data)
    
    logger.warning(f"Invalid data for address update: {serializer.errors}")
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_address(request, address_id):
    """
    Menghapus alamat
    """
    user_id = request.user.id
    logger.info(f"User {user_id} deleting address {address_id}")
    
    try:
        address = Address.objects.get(id=address_id, user=request.user)
    except Address.DoesNotExist:
        logger.warning(f"Address {address_id} not found for user {user_id}")
        return Response(
            {'error': 'Alamat tidak ditemukan'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Tidak boleh menghapus alamat default jika alamat lain masih ada
    if address.is_default and Address.objects.filter(user=request.user).count() > 1:
        logger.warning(f"Cannot delete default address {address_id} because user has other addresses")
        return Response(
            {'error': 'Tidak dapat menghapus alamat default. Ubah alamat lain menjadi default terlebih dahulu.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    address.delete()
    logger.info(f"Address {address_id} successfully deleted by user {user_id}")
    return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def set_default_address(request, address_id):
    """
    Menjadikan alamat sebagai default
    """
    user_id = request.user.id
    logger.info(f"User {user_id} setting address {address_id} as default")
    
    try:
        address = Address.objects.get(id=address_id, user=request.user)
    except Address.DoesNotExist:
        logger.warning(f"Address {address_id} not found for user {user_id}")
        return Response(
            {'error': 'Alamat tidak ditemukan'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Jika alamat sudah default, tidak perlu melakukan apa-apa
    if address.is_default:
        logger.info(f"Address {address_id} already set as default for user {user_id}")
        serializer = AddressSerializer(address)
        return Response(serializer.data)
    
    # Ubah semua alamat lain menjadi non-default
    Address.objects.filter(user=request.user, is_default=True).update(is_default=False)
    
    # Jadikan alamat ini sebagai default
    address.is_default = True
    address.save()
    
    logger.info(f"Address {address_id} successfully set as default for user {user_id}")
    serializer = AddressSerializer(address)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_default_address(request):
    """
    Mendapatkan alamat default pengguna
    """
    user_id = request.user.id
    logger.info(f"User {user_id} requesting default address")
    
    try:
        address = Address.objects.get(user=request.user, is_default=True)
        logger.info(f"Default address found for user {user_id}: {address.id}")
        serializer = AddressSerializer(address)
        return Response(serializer.data)
    except Address.DoesNotExist:
        # Jika tidak ada alamat default, coba dapatkan alamat pertama
        addresses = Address.objects.filter(user=request.user).order_by('-created_at')
        if addresses.exists():
            first_address = addresses.first()
            logger.info(f"No default address, returning first address for user {user_id}: {first_address.id}")
            serializer = AddressSerializer(first_address)
            return Response(serializer.data)
        
        # Jika tidak ada alamat sama sekali
        logger.info(f"No addresses found for user {user_id}")
        return Response(
            {'error': 'Tidak ada alamat yang tersedia'},
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def migrate_local_storage_addresses(request):
    """
    Memigrasikan alamat-alamat dari localStorage ke database
    
    Format data yang diharapkan:
    {
        "addresses": [
            {
                "label": "Rumah",
                "address": "Jl. Contoh No. 123",
                "note": "Catatan untuk alamat",
                "coordinates": "-6.123,106.123",
                "is_default": true
            },
            ...
        ]
    }
    """
    user_id = request.user.id
    user_email = request.user.email  # Use email instead of username
    logger.info(f"User {user_id} ({user_email}) migrating addresses from localStorage")
    
    # Mengambil data alamat dari request
    addresses_data = request.data.get('addresses', [])
    
    logger.info(f"Received {len(addresses_data)} addresses to migrate")
    
    if not addresses_data:
        logger.warning(f"No addresses provided for migration for user {user_id}")
        return Response(
            {'error': 'Tidak ada alamat yang diberikan'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Memeriksa apakah pengguna sudah memiliki alamat di database
    has_existing_addresses = Address.objects.filter(user=request.user).exists()
    logger.info(f"User {user_id} already has addresses: {has_existing_addresses}")
    
    # Hasil migrasi
    created_addresses = []
    errors = []
    
    for i, address_data in enumerate(addresses_data):
        logger.info(f"Processing address {i+1}/{len(addresses_data)} for user {user_id}")
        
        # Menentukan is_default
        # Jika pengguna belum memiliki alamat, alamat pertama menjadi default
        # Atau jika is_default=True di data, tetapi hanya untuk alamat pertama yang default
        is_default = False
        if not has_existing_addresses and i == 0:
            is_default = True
        elif has_existing_addresses and address_data.get('is_default', False) and i == 0:
            is_default = True
        
        # Update data dengan is_default yang sudah ditentukan
        address_data['is_default'] = is_default
        
        # Validasi dan menyimpan alamat
        serializer = CreateAddressSerializer(
            data=address_data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            try:
                address = serializer.save()
                logger.info(f"Successfully migrated address {i+1}, created with ID: {address.id}")
                created_addresses.append(AddressSerializer(address).data)
            except Exception as e:
                logger.error(f"Error saving migrated address {i+1}: {str(e)}")
                errors.append({
                    'data': address_data,
                    'error': str(e)
                })
        else:
            logger.warning(f"Invalid data for address {i+1}: {serializer.errors}")
            errors.append({
                'data': address_data,
                'errors': serializer.errors
            })
    
    # Menentukan status respons
    if errors and not created_addresses:
        logger.error(f"All address migrations failed for user {user_id}")
        return Response(
            {
                'status': 'error',
                'message': 'Gagal memigrasi alamat',
                'errors': errors
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    
    logger.info(f"Migration completed for user {user_id}. Created: {len(created_addresses)}, Errors: {len(errors)}")
    return Response(
        {
            'status': 'success',
            'message': f'{len(created_addresses)} alamat berhasil dimigrasi',
            'addresses': created_addresses,
            'errors': errors
        },
        status=status.HTTP_201_CREATED if created_addresses else status.HTTP_400_BAD_REQUEST
    ) 