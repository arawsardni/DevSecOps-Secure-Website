import uuid
import random
import string
from django.db import transaction
from django.utils import timezone
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.response import Response
from .models import PaymentMethod, BankAccount, Payment, PaymentHistory
from .serializers import (
    PaymentMethodSerializer, PaymentMethodListSerializer, BankAccountSerializer,
    PaymentDetailSerializer, PaymentListSerializer, CreatePaymentSerializer,
    UploadPaymentProofSerializer, PaymentHistorySerializer
)

@api_view(['GET'])
@permission_classes([AllowAny])
def payment_method_list(request):
    """
    Mendapatkan daftar metode pembayaran yang aktif
    """
    payment_methods = PaymentMethod.objects.filter(status='active')
    serializer = PaymentMethodListSerializer(payment_methods, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([AllowAny])
def payment_method_detail(request, method_id):
    """
    Mendapatkan detail metode pembayaran beserta bank accounts (jika ada)
    """
    try:
        payment_method = PaymentMethod.objects.get(id=method_id, status='active')
        serializer = PaymentMethodSerializer(payment_method)
        return Response(serializer.data)
    except PaymentMethod.DoesNotExist:
        return Response(
            {'error': 'Metode pembayaran tidak ditemukan'},
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def payment_list(request):
    """
    Mendapatkan daftar pembayaran untuk user yang sedang login
    """
    payments = Payment.objects.filter(user=request.user).order_by('-created_at')
    serializer = PaymentListSerializer(payments, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def payment_detail(request, payment_id):
    """
    Mendapatkan detail pembayaran
    """
    try:
        payment = Payment.objects.get(id=payment_id, user=request.user)
        serializer = PaymentDetailSerializer(payment)
        return Response(serializer.data)
    except Payment.DoesNotExist:
        return Response(
            {'error': 'Pembayaran tidak ditemukan'},
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_payment(request):
    """
    Membuat pembayaran baru untuk order
    """
    serializer = CreatePaymentSerializer(
        data=request.data,
        context={'request': request}
    )
    
    if serializer.is_valid():
        payment = serializer.save()
        
        # Jika pembayaran QRIS, generate QR code dummy
        if payment.payment_method.method_type == 'qris':
            # Di sini seharusnya integrasikan dengan payment gateway
            # Untuk simulasi, kita buat QRIS ID dummy
            payment.qris_id = f"QRIS-{uuid.uuid4().hex[:8].upper()}"
            payment.save()
        
        # Kembalikan data pembayaran detail
        result_serializer = PaymentDetailSerializer(payment)
        return Response(result_serializer.data, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_payment_proof(request, payment_id):
    """
    Upload bukti pembayaran
    """
    try:
        payment = Payment.objects.get(id=payment_id, user=request.user)
        
        serializer = UploadPaymentProofSerializer(
            payment,
            data=request.data
        )
        
        if serializer.is_valid():
            payment = serializer.save()
            result_serializer = PaymentDetailSerializer(payment)
            return Response(result_serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Payment.DoesNotExist:
        return Response(
            {'error': 'Pembayaran tidak ditemukan'},
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def check_payment_status(request, payment_id):
    """
    Cek status pembayaran
    """
    try:
        payment = Payment.objects.get(id=payment_id, user=request.user)
        
        # Cek jika sudah kedaluwarsa tapi belum diupdate
        if payment.status == 'pending' and payment.is_expired():
            payment.status = 'expired'
            payment.save()
            
            # Buat history pembayaran
            PaymentHistory.objects.create(
                payment=payment,
                status=payment.status,
                notes="Pembayaran kedaluwarsa"
            )
        
        # Kembalikan data pembayaran detail
        serializer = PaymentDetailSerializer(payment)
        return Response(serializer.data)
    except Payment.DoesNotExist:
        return Response(
            {'error': 'Pembayaran tidak ditemukan'},
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cancel_payment(request, payment_id):
    """
    Membatalkan pembayaran (hanya bisa jika status masih pending)
    """
    try:
        payment = Payment.objects.get(id=payment_id, user=request.user)
        
        if payment.status != 'pending':
            return Response(
                {'error': 'Hanya pembayaran dengan status menunggu yang dapat dibatalkan'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        payment.status = 'cancelled'
        payment.save()
        
        # Buat history pembayaran
        PaymentHistory.objects.create(
            payment=payment,
            status=payment.status,
            notes="Pembayaran dibatalkan oleh pengguna"
        )
        
        serializer = PaymentDetailSerializer(payment)
        return Response(serializer.data)
    except Payment.DoesNotExist:
        return Response(
            {'error': 'Pembayaran tidak ditemukan'},
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def simulate_cash_payment(request, payment_id):
    """
    Simulasi pembayaran tunai (khusus untuk demo)
    """
    try:
        payment = Payment.objects.get(id=payment_id, user=request.user)
        
        if payment.payment_method.method_type != 'cash':
            return Response(
                {'error': 'Hanya untuk metode pembayaran tunai'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if payment.status != 'pending':
            return Response(
                {'error': 'Pembayaran tidak dalam status menunggu'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Cek jumlah cash yang diterima
        cash_received = request.data.get('cash_received')
        if not cash_received:
            return Response(
                {'error': 'Jumlah pembayaran tunai harus diisi'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            cash_received = float(cash_received)
        except ValueError:
            return Response(
                {'error': 'Jumlah pembayaran tunai tidak valid'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if cash_received < payment.total_amount:
            return Response(
                {'error': 'Jumlah pembayaran tunai kurang dari total yang harus dibayar'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update payment
        payment.cash_received = cash_received
        payment.cash_change = cash_received - payment.total_amount
        payment.status = 'paid'
        payment.paid_at = timezone.now()
        payment.save()
        
        # Buat history pembayaran
        PaymentHistory.objects.create(
            payment=payment,
            status=payment.status,
            notes=f"Pembayaran tunai berhasil. Diterima: {cash_received}, Kembalian: {payment.cash_change}"
        )
        
        serializer = PaymentDetailSerializer(payment)
        return Response(serializer.data)
    except Payment.DoesNotExist:
        return Response(
            {'error': 'Pembayaran tidak ditemukan'},
            status=status.HTTP_404_NOT_FOUND
        )

# ================= Admin API endpoints =================

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_payment_list(request):
    """
    Admin: Mendapatkan daftar semua pembayaran
    """
    # Filter berdasarkan status, jika ada
    status_filter = request.query_params.get('status')
    if status_filter:
        payments = Payment.objects.filter(status=status_filter).order_by('-created_at')
    else:
        payments = Payment.objects.all().order_by('-created_at')
    
    serializer = PaymentListSerializer(payments, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_payment_detail(request, payment_id):
    """
    Admin: Mendapatkan detail pembayaran
    """
    try:
        payment = Payment.objects.get(id=payment_id)
        serializer = PaymentDetailSerializer(payment)
        return Response(serializer.data)
    except Payment.DoesNotExist:
        return Response(
            {'error': 'Pembayaran tidak ditemukan'},
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_confirm_payment(request, payment_id):
    """
    Admin: Konfirmasi pembayaran berhasil
    """
    try:
        payment = Payment.objects.get(id=payment_id)
        
        if payment.status not in ['pending', 'verifying']:
            return Response(
                {'error': 'Hanya pembayaran dengan status menunggu atau verifikasi yang dapat dikonfirmasi'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        payment.status = 'paid'
        payment.paid_at = timezone.now()
        payment.save()
        
        # Buat history pembayaran
        PaymentHistory.objects.create(
            payment=payment,
            status=payment.status,
            notes="Pembayaran dikonfirmasi oleh admin",
            updated_by=request.user
        )
        
        serializer = PaymentDetailSerializer(payment)
        return Response(serializer.data)
    except Payment.DoesNotExist:
        return Response(
            {'error': 'Pembayaran tidak ditemukan'},
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_reject_payment(request, payment_id):
    """
    Admin: Tolak pembayaran
    """
    try:
        payment = Payment.objects.get(id=payment_id)
        
        if payment.status not in ['pending', 'verifying']:
            return Response(
                {'error': 'Hanya pembayaran dengan status menunggu atau verifikasi yang dapat ditolak'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Dapatkan alasan penolakan
        reason = request.data.get('reason', 'Tidak ada alasan yang diberikan')
        
        payment.status = 'failed'
        payment.save()
        
        # Buat history pembayaran
        PaymentHistory.objects.create(
            payment=payment,
            status=payment.status,
            notes=f"Pembayaran ditolak oleh admin. Alasan: {reason}",
            updated_by=request.user
        )
        
        serializer = PaymentDetailSerializer(payment)
        return Response(serializer.data)
    except Payment.DoesNotExist:
        return Response(
            {'error': 'Pembayaran tidak ditemukan'},
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_create_payment_method(request):
    """
    Admin: Membuat metode pembayaran baru
    """
    serializer = PaymentMethodSerializer(data=request.data)
    
    if serializer.is_valid():
        payment_method = serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT'])
@permission_classes([IsAdminUser])
def admin_update_payment_method(request, method_id):
    """
    Admin: Update metode pembayaran
    """
    try:
        payment_method = PaymentMethod.objects.get(id=method_id)
        serializer = PaymentMethodSerializer(payment_method, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except PaymentMethod.DoesNotExist:
        return Response(
            {'error': 'Metode pembayaran tidak ditemukan'},
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_add_bank_account(request, method_id):
    """
    Admin: Menambahkan rekening bank ke metode pembayaran
    """
    try:
        payment_method = PaymentMethod.objects.get(id=method_id)
        
        if payment_method.method_type != 'bank_transfer':
            return Response(
                {'error': 'Hanya metode pembayaran transfer bank yang dapat memiliki rekening bank'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Tambahkan payment_method ke data request
        request_data = request.data.copy()
        request_data['payment_method'] = method_id
        
        serializer = BankAccountSerializer(data=request_data)
        
        if serializer.is_valid():
            bank_account = serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except PaymentMethod.DoesNotExist:
        return Response(
            {'error': 'Metode pembayaran tidak ditemukan'},
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def admin_delete_bank_account(request, bank_id):
    """
    Admin: Menghapus rekening bank
    """
    try:
        bank_account = BankAccount.objects.get(id=bank_id)
        bank_account.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    except BankAccount.DoesNotExist:
        return Response(
            {'error': 'Rekening bank tidak ditemukan'},
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_payment_stats(request):
    """
    Admin: Mendapatkan statistik pembayaran
    """
    # Total pembayaran berhasil
    total_success = Payment.objects.filter(status='paid').count()
    
    # Total pembayaran pending
    total_pending = Payment.objects.filter(status='pending').count()
    
    # Total pembayaran gagal
    total_failed = Payment.objects.filter(status__in=['failed', 'expired']).count()
    
    # Total pendapatan
    total_revenue = Payment.objects.filter(status='paid').values_list('total_amount', flat=True)
    total_revenue = sum(total_revenue) if total_revenue else 0
    
    # Pembayaran per metode
    payment_by_method = {}
    all_methods = PaymentMethod.objects.all()
    
    for method in all_methods:
        method_count = Payment.objects.filter(payment_method=method, status='paid').count()
        payment_by_method[method.name] = method_count
    
    return Response({
        'total_success': total_success,
        'total_pending': total_pending,
        'total_failed': total_failed,
        'total_revenue': total_revenue,
        'payment_by_method': payment_by_method
    }) 