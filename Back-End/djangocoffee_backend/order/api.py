import uuid
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.response import Response
from django.db import transaction
from django.db.models import Sum, Count, F, Avg, ExpressionWrapper, DecimalField, Case, When, Value, Q
from django.db.models.functions import TruncMonth, TruncDay
from django.utils import timezone
from django.utils.timezone import timedelta
from django.shortcuts import get_object_or_404
from cart.models import Cart
from product.models import Product
from .models import Order, OrderItem, OrderPayment, OrderTracking
from .serializers import (
    OrderListSerializer, OrderDetailSerializer, CreateOrderSerializer,
    OrderPaymentSerializer, OrderTrackingSerializer
)
import logging
from django.core.exceptions import ObjectDoesNotExist

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def order_list(request):
    """
    Mendapatkan daftar pesanan untuk user yang sedang login
    """
    orders = Order.objects.filter(user=request.user).order_by('-created_at')
    serializer = OrderListSerializer(orders, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def order_detail(request, order_id):
    """
    Mendapatkan detail pesanan berdasarkan ID
    """
    try:
        order = Order.objects.get(id=order_id, user=request.user)
    except Order.DoesNotExist:
        return Response(
            {'error': 'Pesanan tidak ditemukan'},
            status=status.HTTP_404_NOT_FOUND
        )
        
    serializer = OrderDetailSerializer(order)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_order(request):
    """
    Membuat pesanan baru
    """
    serializer = CreateOrderSerializer(
        data=request.data,
        context={'request': request}
    )
    
    if serializer.is_valid():
        try:
            with transaction.atomic():
                # Buat pesanan baru
                order = serializer.save()
                
                # Kosongkan keranjang user setelah pesanan dibuat
                try:
                    cart = Cart.objects.get(user=request.user, is_active=True)
                    cart.delete()
                except Cart.DoesNotExist:
                    pass
                
                order_serializer = OrderDetailSerializer(order)
                return Response(order_serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cancel_order(request, order_id):
    """
    Membatalkan pesanan
    """
    try:
        order = Order.objects.get(id=order_id, user=request.user)
        
        # Hanya pesanan dengan status 'new' yang dapat dibatalkan oleh user
        if order.status != 'new':
            return Response(
                {'error': 'Hanya pesanan baru yang dapat dibatalkan'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        order.cancel_order()
        
        # Tambahkan tracking
        OrderTracking.objects.create(
            order=order,
            status='cancelled',
            note='Dibatalkan oleh pengguna'
        )
        
        serializer = OrderDetailSerializer(order)
        return Response(serializer.data)
    except Order.DoesNotExist:
        return Response(
            {'error': 'Pesanan tidak ditemukan'},
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def process_payment(request, order_id):
    """
    Memproses pembayaran untuk pesanan
    """
    try:
        order = Order.objects.get(id=order_id, user=request.user)
        
        # Verifikasi status pesanan
        if order.payment_status != 'pending':
            return Response(
                {'error': 'Pesanan ini tidak dalam status menunggu pembayaran'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Dalam aplikasi nyata, di sini akan ada integrasi dengan payment gateway
        # Untuk simulasi, kita langsung update status pembayaran
        payment = order.payment
        payment.is_paid = True
        
        # If amount is provided in the request data, handle it properly
        if 'amount' in request.data:
            try:
                # Convert to float first if it's a string, then to Decimal
                payment_amount = request.data.get('amount')
                if isinstance(payment_amount, str):
                    payment_amount = float(payment_amount)
                # Make sure it's converted to Decimal before saving
                payment.amount = payment_amount
            except (ValueError, TypeError):
                # If conversion fails, use the original order amount
                payment.amount = order.total_amount
        
        payment.transaction_id = f"TRX-{uuid.uuid4().hex[:8].upper()}"
        payment.save()
        
        # Order akan otomatis diupdate ke status 'paid' oleh save method di OrderPayment
        
        # Tambahkan tracking
        OrderTracking.objects.create(
            order=order,
            status=order.status,
            note='Pembayaran berhasil diproses'
        )
        
        serializer = OrderDetailSerializer(order)
        return Response(serializer.data)
    except Order.DoesNotExist:
        return Response(
            {'error': 'Pesanan tidak ditemukan'},
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['POST'])
@permission_classes([IsAdminUser])
def update_order_status(request, order_id):
    """
    Update status pesanan (hanya untuk admin)
    """
    try:
        order = Order.objects.get(id=order_id)
        
        # Validasi status
        new_status = request.data.get('status')
        if not new_status or new_status not in dict(Order.STATUS_CHOICES):
            return Response(
                {'error': 'Status tidak valid'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update status
        old_status = order.status
        order.status = new_status
        order.save()
        
        # Jika status diubah ke 'completed', panggil method khusus
        if new_status == 'completed' and old_status != 'completed':
            order.mark_as_completed()
        
        # Jika status diubah ke 'cancelled', panggil method khusus
        if new_status == 'cancelled' and old_status != 'cancelled':
            order.cancel_order()
        
        # Tambahkan tracking
        OrderTracking.objects.create(
            order=order,
            status=new_status,
            note=request.data.get('note', 'Status diubah oleh admin'),
            updated_by=request.user
        )
        
        serializer = OrderDetailSerializer(order)
        return Response(serializer.data)
    except Order.DoesNotExist:
        return Response(
            {'error': 'Pesanan tidak ditemukan'},
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_order_list(request):
    """
    Mendapatkan daftar semua pesanan (hanya untuk admin)
    """
    # Filter berdasarkan query parameter
    status = request.query_params.get('status')
    payment_status = request.query_params.get('payment_status')
    delivery_method = request.query_params.get('delivery_method')
    date_from = request.query_params.get('date_from')
    date_to = request.query_params.get('date_to')
    
    orders = Order.objects.all()
    
    if status:
        orders = orders.filter(status=status)
    
    if payment_status:
        orders = orders.filter(payment_status=payment_status)
    
    if delivery_method:
        orders = orders.filter(delivery_method=delivery_method)
    
    if date_from:
        orders = orders.filter(created_at__gte=date_from)
    
    if date_to:
        orders = orders.filter(created_at__lte=date_to)
    
    orders = orders.order_by('-created_at')
    
    serializer = OrderListSerializer(orders, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_order_detail(request, order_id):
    """
    Mendapatkan detail pesanan untuk admin
    """
    try:
        order = Order.objects.get(id=order_id)
        serializer = OrderDetailSerializer(order)
        return Response(serializer.data)
    except Order.DoesNotExist:
        return Response(
            {'error': 'Pesanan tidak ditemukan'},
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['GET'])
@permission_classes([IsAdminUser])
def revenue_report(request):
    """
    Laporan pendapatan (hanya untuk admin)
    """
    # Filter berdasarkan query parameter
    period = request.query_params.get('period', 'day')  # day, week, month, year
    date_from = request.query_params.get('date_from')
    date_to = request.query_params.get('date_to')
    
    # Filter orders yang sudah dibayar
    orders = Order.objects.filter(payment_status='paid')
    
    if date_from:
        orders = orders.filter(created_at__gte=date_from)
    else:
        # Default: 30 hari terakhir
        orders = orders.filter(created_at__gte=timezone.now() - timedelta(days=30))
    
    if date_to:
        orders = orders.filter(created_at__lte=date_to)
    
    # Grouping berdasarkan periode
    if period == 'day':
        report = orders.extra({'date': "date(created_at)"}).values('date')
        report = report.annotate(
            revenue=Sum('total_amount'),
            orders_count=Count('id')
        ).order_by('date')
    elif period == 'week':
        report = orders.extra({'week': "date_trunc('week', created_at)"}).values('week')
        report = report.annotate(
            revenue=Sum('total_amount'),
            orders_count=Count('id')
        ).order_by('week')
    elif period == 'month':
        report = orders.extra({'month': "date_trunc('month', created_at)"}).values('month')
        report = report.annotate(
            revenue=Sum('total_amount'),
            orders_count=Count('id')
        ).order_by('month')
    elif period == 'year':
        report = orders.extra({'year': "date_trunc('year', created_at)"}).values('year')
        report = report.annotate(
            revenue=Sum('total_amount'),
            orders_count=Count('id')
        ).order_by('year')
    
    # Summary
    total_revenue = orders.aggregate(total=Sum('total_amount'))['total'] or 0
    total_orders = orders.count()
    average_order_value = total_revenue / total_orders if total_orders > 0 else 0
    
    return Response({
        'report': report,
        'summary': {
            'total_revenue': total_revenue,
            'total_orders': total_orders,
            'average_order_value': average_order_value
        }
    })

@api_view(['GET'])
@permission_classes([IsAdminUser])
def top_products_report(request):
    """
    Laporan produk terlaris (hanya untuk admin)
    """
    # Filter berdasarkan query parameter
    date_from = request.query_params.get('date_from')
    date_to = request.query_params.get('date_to')
    limit = int(request.query_params.get('limit', 10))
    
    # Filter orders yang sudah selesai
    order_items = OrderItem.objects.filter(order__status='completed')
    
    if date_from:
        order_items = order_items.filter(order__created_at__gte=date_from)
    else:
        # Default: 30 hari terakhir
        order_items = order_items.filter(order__created_at__gte=timezone.now() - timedelta(days=30))
    
    if date_to:
        order_items = order_items.filter(order__created_at__lte=date_to)
    
    # Group by product
    top_products = order_items.values('product').annotate(
        product_name=F('product__name'),
        total_quantity=Sum('quantity'),
        total_revenue=Sum(F('price') * F('quantity'))
    ).order_by('-total_quantity')[:limit]
    
    return Response(top_products)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_completed_orders(request, user_id):
    try:
        # Pastikan user hanya bisa melihat pesanannya sendiri
        if request.user.id != user_id:
            return Response({'error': 'Tidak diizinkan melihat pesanan user lain'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        # Ambil semua pesanan yang sudah selesai
        orders = Order.objects.filter(
            user_id=user_id,
            status='completed'
        ).prefetch_related(
            'items',
            'items__product'
        ).order_by('-created_at')

        # Serialize data pesanan dengan OrderDetailSerializer
        serializer = OrderDetailSerializer(orders, many=True)
        return Response(serializer.data)

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_order_by_number(request, order_number):
    """
    Mendapatkan detail pesanan berdasarkan nomor pesanan
    """
    try:
        # For authenticated users, find their order with the specified order number
        order = Order.objects.get(order_number=order_number, user=request.user)
        serializer = OrderDetailSerializer(order)
        return Response(serializer.data)
    except Order.DoesNotExist:
        return Response(
            {'error': f'Pesanan dengan nomor {order_number} tidak ditemukan'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        # Add general exception handler for debugging
        return Response(
            {'error': f'Error retrieving order: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_purchased_products(request, user_id):
    """
    Mengembalikan daftar produk unik yang pernah dibeli user.
    Digunakan untuk fitur review produk.
    Produk yang sama hanya muncul sekali meskipun dibeli beberapa kali.
    """
    try:
        # Pastikan user hanya bisa melihat produk yang pernah dia beli
        if request.user.id != user_id:
            return Response({'error': 'Tidak diizinkan melihat riwayat pembelian user lain'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        # Ambil semua item dari pesanan yang sudah selesai
        order_items = OrderItem.objects.filter(
            order__user_id=user_id,
            order__status='completed'
        ).select_related(
            'product', 
            'order'
        ).prefetch_related(
            'product__category'
        ).order_by('-order__created_at')  # Order by most recent orders first
        
        # Gunakan dict untuk menyimpan produk unik (dengan prioritas)
        processed_products = {}
        
        # Ambil produk unik dari order items dengan prioritas pada pesanan normal vs test
        for item in order_items:
            product_id = item.product.id
            
            # Skip if we already have this product from a non-test order
            is_test_order = item.order.order_number.startswith('TST')
            if product_id in processed_products and not processed_products[product_id].get('is_test_order', False):
                continue
                
            # Format data produk dengan informasi lebih lengkap
            product_obj = item.product
            product_data = {
                'id': product_id,
                'product_id': product_id,  # Duplikasi untuk compatibility dengan frontend
                'name': product_obj.name,
                'title': product_obj.name,  # Duplikasi untuk compatibility dengan frontend
                'description': product_obj.description,
                'price': float(product_obj.price),
                'category': product_obj.category.name if product_obj.category else None,
                'category_id': product_obj.category.id if product_obj.category else None,
                'image': product_obj.image.url if product_obj.image else None,
                'image_url': product_obj.image.url if product_obj.image else None,
                'size': item.size,
                'is_test_order': is_test_order,
                'order_number': item.order.order_number,
                'first_purchased_at': item.order.created_at,
                'last_purchased_at': item.order.completed_at or item.order.created_at
            }
            
            # Add or replace in our dictionary (replace only if this is a non-test order or if we only have a test order)
            if product_id not in processed_products or is_test_order == False:
                processed_products[product_id] = product_data
        
        # Convert dict to list, sorted by most recently purchased first
        unique_products = list(processed_products.values())
        unique_products.sort(key=lambda x: x['first_purchased_at'], reverse=True)
        
        # Filter out internal fields before returning
        for product in unique_products:
            if 'is_test_order' in product:
                del product['is_test_order']
                
        print(f"Found {len(unique_products)} unique purchased products for user {user_id}")
        return Response(unique_products)

    except Exception as e:
        print(f"Error in user_purchased_products: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_test_orders(request):
    """
    Create test orders for the current user to test the product reviews feature.
    This is ONLY for testing purposes.
    """
    try:
        user = request.user
        
        # Get some products
        products = Product.objects.all()[:5]
        if not products:
            return Response({'error': 'No products found to create test orders'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        num_orders = 2
        created_orders = []
        
        for i in range(num_orders):
            # Create a new completed order
            order = Order.objects.create(
                user=user,
                order_number=f"TST{i+10000}",
                total_amount=100000.00,
                status='completed',
                payment_status='paid',
                delivery_method='pickup',
                pickup_location='Test Store',
                completed_at=timezone.now() - timedelta(days=i+1)
            )
            
            # Add items to the order
            for j, product in enumerate(products[:3]):
                # Create order item
                item = OrderItem.objects.create(
                    order=order,
                    product=product,
                    quantity=1,
                    price=product.price or 10000.00
                )
            
            created_orders.append(order.order_number)
        
        return Response({
            'message': f'Created {num_orders} test orders with products for reviews',
            'orders': created_orders
        })

    except Exception as e:
        print(f"Error creating test orders: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR) 