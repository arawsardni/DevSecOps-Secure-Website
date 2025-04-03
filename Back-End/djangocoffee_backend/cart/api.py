import uuid
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from product.models import Product
from .models import Cart, CartItem
from .serializers import (
    CartSerializer, 
    CartItemSerializer, 
    AddToCartSerializer,
    UpdateCartItemSerializer
)

def get_or_create_cart(request):
    """
    Mendapatkan keranjang untuk user, atau membuat keranjang baru jika belum ada.
    Untuk guest users, gunakan session ID.
    """
    if request.user.is_authenticated:
        cart, created = Cart.objects.get_or_create(
            user=request.user, 
            is_active=True
        )
    else:
        session_id = request.session.session_key
        if not session_id:
            request.session.create()
            session_id = request.session.session_key
            
        cart, created = Cart.objects.get_or_create(
            session_id=session_id,
            is_active=True
        )
    return cart

@api_view(['GET'])
@permission_classes([AllowAny])
def get_cart(request):
    """
    Mendapatkan keranjang belanja untuk user saat ini
    """
    cart = get_or_create_cart(request)
    serializer = CartSerializer(cart)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([AllowAny])
def add_to_cart(request):
    """
    Menambahkan item ke keranjang. Jika produk dengan ukuran yang sama sudah ada,
    kuantitas akan ditambahkan.
    """
    serializer = AddToCartSerializer(data=request.data)
    if serializer.is_valid():
        product_id = serializer.validated_data['product_id']
        quantity = serializer.validated_data['quantity']
        size = serializer.validated_data.get('size')
        special_instructions = serializer.validated_data.get('special_instructions', '')
        
        try:
            product = Product.objects.get(id=product_id)
            if not product.is_available or product.stock < quantity:
                return Response(
                    {'error': 'Produk tidak tersedia atau stok tidak cukup'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            cart = get_or_create_cart(request)
            
            # Cek apakah item sudah ada di keranjang
            cart_item, created = CartItem.objects.get_or_create(
                cart=cart,
                product=product,
                size=size,
                defaults={
                    'quantity': quantity,
                    'special_instructions': special_instructions
                }
            )
            
            # Jika item sudah ada, tambahkan kuantitas
            if not created:
                cart_item.quantity += quantity
                cart_item.special_instructions = special_instructions
                cart_item.save()
                
            serializer = CartSerializer(cart)
            return Response(serializer.data)
            
        except Product.DoesNotExist:
            return Response(
                {'error': 'Produk tidak ditemukan'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT'])
@permission_classes([AllowAny])
def update_cart_item(request, item_id):
    """
    Update kuantitas item di keranjang
    """
    try:
        cart = get_or_create_cart(request)
        cart_item = CartItem.objects.get(id=item_id, cart=cart)
    except CartItem.DoesNotExist:
        return Response(
            {'error': 'Item tidak ditemukan di keranjang'},
            status=status.HTTP_404_NOT_FOUND
        )
        
    serializer = UpdateCartItemSerializer(data=request.data)
    if serializer.is_valid():
        quantity = serializer.validated_data['quantity']
        special_instructions = serializer.validated_data.get('special_instructions')
        
        # Cek stok produk
        if cart_item.product.stock < quantity:
            return Response(
                {'error': 'Stok tidak cukup'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        cart_item.quantity = quantity
        if special_instructions is not None:
            cart_item.special_instructions = special_instructions
        cart_item.save()
        
        cart_serializer = CartSerializer(cart)
        return Response(cart_serializer.data)
        
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([AllowAny])
def remove_cart_item(request, item_id):
    """
    Menghapus item dari keranjang
    """
    try:
        cart = get_or_create_cart(request)
        cart_item = CartItem.objects.get(id=item_id, cart=cart)
        cart_item.delete()
        
        cart_serializer = CartSerializer(cart)
        return Response(cart_serializer.data)
    except CartItem.DoesNotExist:
        return Response(
            {'error': 'Item tidak ditemukan di keranjang'},
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def clear_cart(request):
    """
    Menghapus semua item dari keranjang
    """
    cart = get_or_create_cart(request)
    cart.clear()
    
    cart_serializer = CartSerializer(cart)
    return Response(cart_serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def merge_carts(request):
    """
    Memindahkan item dari cart guest ke cart user setelah login
    """
    session_id = request.session.session_key
    
    if not session_id:
        # Jika tidak ada session, tidak ada yang perlu dipindahkan
        return Response({'message': 'Tidak ada keranjang guest untuk dipindahkan'})
    
    try:
        guest_cart = Cart.objects.get(session_id=session_id, is_active=True)
        user_cart, created = Cart.objects.get_or_create(user=request.user, is_active=True)
        
        # Pindahkan semua item dari guest cart ke user cart
        for item in guest_cart.items.all():
            # Cek apakah item sudah ada di user cart
            existing_item, item_exists = CartItem.objects.get_or_create(
                cart=user_cart,
                product=item.product,
                size=item.size,
                defaults={
                    'quantity': item.quantity,
                    'special_instructions': item.special_instructions
                }
            )
            
            # Jika item sudah ada, tambahkan kuantitas
            if item_exists:
                existing_item.quantity += item.quantity
                existing_item.save()
                
        # Hapus guest cart
        guest_cart.delete()
        
        serializer = CartSerializer(user_cart)
        return Response(serializer.data)
        
    except Cart.DoesNotExist:
        return Response({'message': 'Tidak ada keranjang guest untuk dipindahkan'}) 