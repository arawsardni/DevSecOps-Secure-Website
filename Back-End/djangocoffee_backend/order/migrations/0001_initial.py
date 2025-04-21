from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Order',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('order_number', models.CharField(max_length=20, unique=True)),
                ('total_amount', models.DecimalField(decimal_places=2, max_digits=10)),
                ('status', models.CharField(choices=[('new', 'Pesanan Baru'), ('processing', 'Sedang Diproses'), ('ready', 'Siap Diambil/Diantar'), ('completed', 'Selesai'), ('cancelled', 'Dibatalkan')], default='new', max_length=20)),
                ('payment_status', models.CharField(choices=[('pending', 'Menunggu Pembayaran'), ('paid', 'Sudah Dibayar'), ('failed', 'Gagal'), ('refunded', 'Dikembalikan')], default='pending', max_length=20)),
                ('delivery_method', models.CharField(choices=[('pickup', 'Ambil Sendiri'), ('delivery', 'Antar ke Alamat')], default='pickup', max_length=20)),
                ('delivery_address_text', models.TextField(blank=True, help_text='Alamat pengiriman dalam bentuk teks', null=True)),
                ('delivery_fee', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ('delivery_notes', models.TextField(blank=True, null=True)),
                ('pickup_location', models.CharField(blank=True, max_length=255, null=True)),
                ('pickup_time', models.DateTimeField(blank=True, null=True)),
                ('special_instructions', models.TextField(blank=True, null=True)),
                ('estimated_delivery_time', models.DateTimeField(blank=True, null=True)),
                ('points_earned', models.IntegerField(default=0)),
                ('points_used', models.IntegerField(default=0)),
                ('discount_amount', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('completed_at', models.DateTimeField(blank=True, null=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='orders', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ] 