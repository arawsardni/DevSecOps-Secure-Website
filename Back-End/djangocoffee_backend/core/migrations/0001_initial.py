# Generated by Django 5.1.7 on 2025-04-02 11:29

import django.db.models.deletion
import django.utils.timezone
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='BannerImage',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=100)),
                ('subtitle', models.CharField(blank=True, max_length=200, null=True)),
                ('image', models.ImageField(upload_to='banners/')),
                ('position', models.CharField(choices=[('homepage_slider', 'Homepage Slider'), ('homepage_top', 'Homepage Top'), ('homepage_middle', 'Homepage Middle'), ('homepage_bottom', 'Homepage Bottom'), ('category_page', 'Category Page'), ('product_page', 'Product Page')], default='homepage_slider', max_length=50)),
                ('link_url', models.CharField(blank=True, max_length=255, null=True)),
                ('button_text', models.CharField(blank=True, max_length=30, null=True)),
                ('text_color', models.CharField(default='#FFFFFF', help_text='HEX code (misal: #FFFFFF)', max_length=20)),
                ('is_active', models.BooleanField(default=True)),
                ('order_sequence', models.PositiveSmallIntegerField(default=1)),
                ('start_date', models.DateTimeField(blank=True, null=True)),
                ('end_date', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Banner',
                'verbose_name_plural': 'Banner',
                'ordering': ['position', 'order_sequence'],
            },
        ),
        migrations.CreateModel(
            name='ContentBlock',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=100)),
                ('slug', models.SlugField(unique=True)),
                ('location', models.CharField(choices=[('about_us', 'About Us'), ('terms_conditions', 'Terms & Conditions'), ('privacy_policy', 'Privacy Policy'), ('faq', 'FAQ'), ('contact_us', 'Contact Us'), ('home_welcome', 'Homepage Welcome'), ('custom', 'Custom Page')], max_length=50)),
                ('content', models.TextField()),
                ('meta_title', models.CharField(blank=True, max_length=100, null=True)),
                ('meta_description', models.TextField(blank=True, null=True)),
                ('is_active', models.BooleanField(default=True)),
                ('show_in_footer', models.BooleanField(default=False)),
                ('show_in_header', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Blok Konten',
                'verbose_name_plural': 'Blok Konten',
                'ordering': ['location', 'title'],
            },
        ),
        migrations.CreateModel(
            name='FAQ',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('question', models.CharField(max_length=255)),
                ('answer', models.TextField()),
                ('category', models.CharField(choices=[('general', 'Umum'), ('order', 'Pemesanan'), ('payment', 'Pembayaran'), ('shipping', 'Pengiriman'), ('product', 'Produk'), ('account', 'Akun')], default='general', max_length=20)),
                ('is_active', models.BooleanField(default=True)),
                ('order_sequence', models.PositiveSmallIntegerField(default=1)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'FAQ',
                'verbose_name_plural': 'FAQ',
                'ordering': ['category', 'order_sequence'],
            },
        ),
        migrations.CreateModel(
            name='SiteConfiguration',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('site_name', models.CharField(default='Coffee Shop', max_length=100)),
                ('site_logo', models.ImageField(blank=True, null=True, upload_to='site/')),
                ('site_favicon', models.ImageField(blank=True, null=True, upload_to='site/')),
                ('tagline', models.CharField(blank=True, max_length=200, null=True)),
                ('meta_description', models.TextField(blank=True, null=True)),
                ('meta_keywords', models.CharField(blank=True, max_length=255, null=True)),
                ('email', models.EmailField(blank=True, max_length=254, null=True)),
                ('phone_number', models.CharField(blank=True, max_length=20, null=True)),
                ('address', models.TextField(blank=True, null=True)),
                ('facebook_url', models.URLField(blank=True, null=True)),
                ('instagram_url', models.URLField(blank=True, null=True)),
                ('twitter_url', models.URLField(blank=True, null=True)),
                ('whatsapp_number', models.CharField(blank=True, max_length=20, null=True)),
                ('google_maps_link', models.URLField(blank=True, null=True)),
                ('google_maps_embed', models.TextField(blank=True, help_text='HTML embed code for Google Maps', null=True)),
                ('opening_hours', models.TextField(blank=True, help_text='Format: Monday-Friday: 8:00 - 21:00', null=True)),
                ('minimum_order_value', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ('delivery_range_km', models.DecimalField(decimal_places=2, default=10.0, max_digits=5)),
                ('primary_color', models.CharField(default='#6F4E37', help_text='HEX code (misal: #6F4E37)', max_length=20)),
                ('secondary_color', models.CharField(default='#D2B48C', help_text='HEX code (misal: #D2B48C)', max_length=20)),
                ('accent_color', models.CharField(default='#FFDD95', help_text='HEX code (misal: #FFDD95)', max_length=20)),
                ('footer_text', models.TextField(blank=True, null=True)),
                ('copyright_text', models.CharField(blank=True, max_length=255, null=True)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Konfigurasi Situs',
                'verbose_name_plural': 'Konfigurasi Situs',
            },
        ),
        migrations.CreateModel(
            name='Testimonial',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=100)),
                ('position', models.CharField(blank=True, help_text='Contoh: Coffee Enthusiast', max_length=100, null=True)),
                ('image', models.ImageField(blank=True, null=True, upload_to='testimonials/')),
                ('content', models.TextField()),
                ('rating', models.PositiveSmallIntegerField(default=5, help_text='Rating dari 1-5')),
                ('is_active', models.BooleanField(default=True)),
                ('order_sequence', models.PositiveSmallIntegerField(default=1)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Testimonial',
                'verbose_name_plural': 'Testimonial',
                'ordering': ['order_sequence', '-created_at'],
            },
        ),
        migrations.CreateModel(
            name='ContactMessage',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=100)),
                ('email', models.EmailField(max_length=254)),
                ('subject', models.CharField(max_length=200)),
                ('message', models.TextField()),
                ('status', models.CharField(choices=[('new', 'Baru'), ('read', 'Sudah Dibaca'), ('replied', 'Sudah Dibalas'), ('closed', 'Ditutup')], default='new', max_length=20)),
                ('reply_message', models.TextField(blank=True, null=True)),
                ('replied_at', models.DateTimeField(blank=True, null=True)),
                ('ip_address', models.GenericIPAddressField(blank=True, null=True)),
                ('user_agent', models.TextField(blank=True, null=True)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('replied_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Pesan Kontak',
                'verbose_name_plural': 'Pesan Kontak',
                'ordering': ['-created_at'],
            },
        ),
    ]
