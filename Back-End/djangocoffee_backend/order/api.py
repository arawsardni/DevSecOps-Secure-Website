import uuid
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.response import Response
from django.db import transaction
from django.db.models import Sum, Count, F
from django.utils import timezone
from datetime import timedelta
from cart.models import Cart
from product.models import Product
from .models import Order, OrderItem, OrderPayment, OrderTracking
from .serializers import (
    OrderListSerializer, OrderDetailSerializer, CreateOrderSerializer,
    OrderPaymentSerializer, OrderTrackingSerializer
)

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