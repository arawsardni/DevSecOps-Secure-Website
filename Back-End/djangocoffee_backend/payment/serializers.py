from rest_framework import serializers
from .models import PaymentMethod, BankAccount, Payment, PaymentHistory

class BankAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = BankAccount
        fields = ['id', 'bank_name', 'account_name', 'account_number', 'branch', 'is_active']

class PaymentMethodSerializer(serializers.ModelSerializer):
    bank_accounts = BankAccountSerializer(many=True, read_only=True)
    
    class Meta:
        model = PaymentMethod
        fields = ['id', 'name', 'method_type', 'description', 'icon', 'admin_fee', 'bank_accounts']

class PaymentMethodListSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentMethod
        fields = ['id', 'name', 'method_type', 'description', 'icon', 'admin_fee', 'is_featured']

class PaymentHistorySerializer(serializers.ModelSerializer):
    updated_by_name = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()
    
    class Meta:
        model = PaymentHistory
        fields = ['id', 'status', 'status_display', 'timestamp', 'notes', 'updated_by', 'updated_by_name']
    
    def get_updated_by_name(self, obj):
        if obj.updated_by:
            return obj.updated_by.name
        return None
    
    def get_status_display(self, obj):
        return obj.get_status_display()

class PaymentDetailSerializer(serializers.ModelSerializer):
    payment_method = PaymentMethodSerializer(read_only=True)
    bank_account = BankAccountSerializer(read_only=True)
    history = PaymentHistorySerializer(many=True, read_only=True)
    status_display = serializers.SerializerMethodField()
    order_number = serializers.SerializerMethodField()
    
    class Meta:
        model = Payment
        fields = [
            'id', 'user', 'order', 'order_number', 'payment_method', 'amount', 'admin_fee', 
            'total_amount', 'reference_id', 'status', 'status_display', 'payment_proof',
            'bank_account', 'bank_sender_name', 'bank_sender_number',
            'qris_code', 'qris_id', 'cash_received', 'cash_change',
            'created_at', 'updated_at', 'paid_at', 'expired_at', 'history'
        ]
    
    def get_status_display(self, obj):
        return obj.get_status_display()
    
    def get_order_number(self, obj):
        return obj.order.order_number if obj.order else None

class PaymentListSerializer(serializers.ModelSerializer):
    payment_method_name = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()
    order_number = serializers.SerializerMethodField()
    
    class Meta:
        model = Payment
        fields = [
            'id', 'reference_id', 'order', 'order_number', 'payment_method_name', 
            'total_amount', 'status', 'status_display', 'created_at', 'expired_at'
        ]
    
    def get_payment_method_name(self, obj):
        return obj.payment_method.name if obj.payment_method else None
    
    def get_status_display(self, obj):
        return obj.get_status_display()
    
    def get_order_number(self, obj):
        return obj.order.order_number if obj.order else None

class CreatePaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['order', 'payment_method']
    
    def validate_order(self, value):
        """
        Validasi order:
        - Order harus milik user yang login
        - Order harus dalam status 'new'
        - Order belum memiliki pembayaran
        """
        user = self.context['request'].user
        if value.user != user:
            raise serializers.ValidationError("Order ini bukan milik Anda")
        
        if value.payment_status != 'pending':
            raise serializers.ValidationError("Order ini sudah dibayar atau dibatalkan")
        
        if Payment.objects.filter(order=value).exists():
            raise serializers.ValidationError("Order ini sudah memiliki pembayaran")
        
        return value
    
    def validate_payment_method(self, value):
        """
        Validasi metode pembayaran:
        - Harus dalam status active
        """
        if value.status != 'active':
            raise serializers.ValidationError("Metode pembayaran ini tidak aktif")
        
        return value
    
    def create(self, validated_data):
        order = validated_data.get('order')
        payment_method = validated_data.get('payment_method')
        user = self.context['request'].user
        
        # Buat pembayaran baru
        payment = Payment.objects.create(
            user=user,
            order=order,
            payment_method=payment_method,
            amount=order.get_final_total(),
            admin_fee=payment_method.admin_fee,
        )
        
        # Jika metode pembayaran adalah transfer bank, set bank_account pertama
        if payment_method.method_type == 'bank_transfer' and payment_method.bank_accounts.filter(is_active=True).exists():
            payment.bank_account = payment_method.bank_accounts.filter(is_active=True).first()
            payment.save()
        
        # Buat history pembayaran
        PaymentHistory.objects.create(
            payment=payment,
            status=payment.status,
            notes="Pembayaran dibuat"
        )
        
        return payment

class UploadPaymentProofSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['payment_proof', 'bank_sender_name', 'bank_sender_number']
    
    def validate(self, data):
        """
        Validasi:
        - Pembayaran harus dalam status pending
        - Jika metode pembayaran transfer, harus ada bank_sender_name dan bank_sender_number
        """
        payment = self.instance
        
        if payment.status != 'pending':
            raise serializers.ValidationError("Pembayaran tidak dalam status menunggu")
        
        if payment.payment_method.method_type == 'bank_transfer':
            if not data.get('bank_sender_name'):
                raise serializers.ValidationError("Nama pengirim bank harus diisi")
            if not data.get('bank_sender_number'):
                raise serializers.ValidationError("Nomor rekening pengirim harus diisi")
        
        return data
    
    def update(self, instance, validated_data):
        payment = super().update(instance, validated_data)
        
        # Otomatis ubah status menjadi verifying
        payment.verify_payment()
        
        # Buat riwayat pembayaran
        PaymentHistory.objects.create(
            payment=payment,
            status=payment.status,
            notes="Bukti pembayaran diunggah, menunggu verifikasi"
        )
        
        return payment 