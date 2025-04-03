import uuid
from django.db import models
from django.utils import timezone
from django.conf import settings
# from ckeditor.fields import RichTextField  # Komentar untuk sementara

class SiteConfiguration(models.Model):
    """
    Model untuk menyimpan konfigurasi global website
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    site_name = models.CharField(max_length=100, default="Coffee Shop")
    site_logo = models.ImageField(upload_to='site/', blank=True, null=True)
    site_favicon = models.ImageField(upload_to='site/', blank=True, null=True)
    tagline = models.CharField(max_length=200, blank=True, null=True)
    meta_description = models.TextField(blank=True, null=True)
    meta_keywords = models.CharField(max_length=255, blank=True, null=True)
    
    # Informasi kontak
    email = models.EmailField(blank=True, null=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    
    # Social media
    facebook_url = models.URLField(blank=True, null=True)
    instagram_url = models.URLField(blank=True, null=True)
    twitter_url = models.URLField(blank=True, null=True)
    whatsapp_number = models.CharField(max_length=20, blank=True, null=True)
    
    # Google Maps
    google_maps_link = models.URLField(blank=True, null=True)
    google_maps_embed = models.TextField(blank=True, null=True, help_text="HTML embed code for Google Maps")
    
    # Pengaturan operasional
    opening_hours = models.TextField(blank=True, null=True, help_text="Format: Monday-Friday: 8:00 - 21:00")
    minimum_order_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    delivery_range_km = models.DecimalField(max_digits=5, decimal_places=2, default=10.0)
    
    # Pengaturan tampilan
    primary_color = models.CharField(max_length=20, default="#6F4E37", help_text="HEX code (misal: #6F4E37)")
    secondary_color = models.CharField(max_length=20, default="#D2B48C", help_text="HEX code (misal: #D2B48C)")
    accent_color = models.CharField(max_length=20, default="#FFDD95", help_text="HEX code (misal: #FFDD95)")
    
    # Footer
    footer_text = models.TextField(blank=True, null=True)
    copyright_text = models.CharField(max_length=255, blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Konfigurasi Situs"
        verbose_name_plural = "Konfigurasi Situs"
    
    def __str__(self):
        return self.site_name
    
    def save(self, *args, **kwargs):
        # Pastikan hanya ada 1 instance
        if not self.pk and SiteConfiguration.objects.exists():
            # Update instance yang sudah ada
            existing = SiteConfiguration.objects.first()
            
            for field in self._meta.fields:
                if field.name != 'id' and hasattr(self, field.name):
                    setattr(existing, field.name, getattr(self, field.name))
            
            existing.save()
            return existing
        
        return super().save(*args, **kwargs)
    
    @classmethod
    def get_instance(cls):
        """
        Mendapatkan instance konfigurasi, atau membuat jika belum ada
        """
        instance, created = cls.objects.get_or_create()
        return instance

class BannerImage(models.Model):
    """
    Model untuk banner/slider images di homepage
    """
    POSITION_CHOICES = [
        ('homepage_slider', 'Homepage Slider'),
        ('homepage_top', 'Homepage Top'),
        ('homepage_middle', 'Homepage Middle'),
        ('homepage_bottom', 'Homepage Bottom'),
        ('category_page', 'Category Page'),
        ('product_page', 'Product Page'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=100)
    subtitle = models.CharField(max_length=200, blank=True, null=True)
    image = models.ImageField(upload_to='banners/')
    position = models.CharField(max_length=50, choices=POSITION_CHOICES, default='homepage_slider')
    link_url = models.CharField(max_length=255, blank=True, null=True)
    
    # Opsi tambahan
    button_text = models.CharField(max_length=30, blank=True, null=True)
    text_color = models.CharField(max_length=20, default="#FFFFFF", help_text="HEX code (misal: #FFFFFF)")
    is_active = models.BooleanField(default=True)
    order_sequence = models.PositiveSmallIntegerField(default=1)
    
    # Waktu aktif
    start_date = models.DateTimeField(blank=True, null=True)
    end_date = models.DateTimeField(blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['position', 'order_sequence']
        verbose_name = "Banner"
        verbose_name_plural = "Banner"
    
    def __str__(self):
        return self.title
    
    def is_valid_date(self):
        """
        Mengecek apakah banner masih valid berdasarkan tanggal
        """
        now = timezone.now()
        
        # Jika tidak ada start_date dan end_date, selalu valid
        if not self.start_date and not self.end_date:
            return True
        
        # Jika hanya ada start_date
        if self.start_date and not self.end_date:
            return now >= self.start_date
        
        # Jika hanya ada end_date
        if not self.start_date and self.end_date:
            return now <= self.end_date
        
        # Jika keduanya ada
        return self.start_date <= now <= self.end_date

class ContentBlock(models.Model):
    """
    Model untuk menyimpan blok konten dinamis seperti About Us, Terms, dll.
    """
    LOCATION_CHOICES = [
        ('about_us', 'About Us'),
        ('terms_conditions', 'Terms & Conditions'),
        ('privacy_policy', 'Privacy Policy'),
        ('faq', 'FAQ'),
        ('contact_us', 'Contact Us'),
        ('home_welcome', 'Homepage Welcome'),
        ('custom', 'Custom Page'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    location = models.CharField(max_length=50, choices=LOCATION_CHOICES)
    content = models.TextField()  # Menggunakan TextField biasa sementara
    
    # Meta info
    meta_title = models.CharField(max_length=100, blank=True, null=True)
    meta_description = models.TextField(blank=True, null=True)
    
    # Options
    is_active = models.BooleanField(default=True)
    show_in_footer = models.BooleanField(default=False)
    show_in_header = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['location', 'title']
        verbose_name = "Blok Konten"
        verbose_name_plural = "Blok Konten"
    
    def __str__(self):
        return self.title

class ContactMessage(models.Model):
    """
    Model untuk menyimpan pesan kontak dari pengunjung
    """
    STATUS_CHOICES = [
        ('new', 'Baru'),
        ('read', 'Sudah Dibaca'),
        ('replied', 'Sudah Dibalas'),
        ('closed', 'Ditutup'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    email = models.EmailField()
    subject = models.CharField(max_length=200)
    message = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')
    
    # Reply information
    replied_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    reply_message = models.TextField(blank=True, null=True)
    replied_at = models.DateTimeField(blank=True, null=True)
    
    # Metadata
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Pesan Kontak"
        verbose_name_plural = "Pesan Kontak"
    
    def __str__(self):
        return f"{self.name} - {self.subject}"
    
    def mark_as_read(self):
        """
        Menandai pesan sebagai sudah dibaca
        """
        if self.status == 'new':
            self.status = 'read'
            self.save()
    
    def mark_as_replied(self, user, reply_message):
        """
        Menandai pesan sebagai sudah dibalas
        """
        self.status = 'replied'
        self.replied_by = user
        self.reply_message = reply_message
        self.replied_at = timezone.now()
        self.save()

class FAQ(models.Model):
    """
    Model untuk menyimpan Frequently Asked Questions
    """
    CATEGORY_CHOICES = [
        ('general', 'Umum'),
        ('order', 'Pemesanan'),
        ('payment', 'Pembayaran'),
        ('shipping', 'Pengiriman'),
        ('product', 'Produk'),
        ('account', 'Akun'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    question = models.CharField(max_length=255)
    answer = models.TextField()  # Menggunakan TextField biasa sementara
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='general')
    is_active = models.BooleanField(default=True)
    order_sequence = models.PositiveSmallIntegerField(default=1)
    
    # Timestamps
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['category', 'order_sequence']
        verbose_name = "FAQ"
        verbose_name_plural = "FAQ"
    
    def __str__(self):
        return self.question

class Testimonial(models.Model):
    """
    Model untuk menyimpan testimonial pelanggan
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    position = models.CharField(max_length=100, blank=True, null=True, help_text="Contoh: Coffee Enthusiast")
    image = models.ImageField(upload_to='testimonials/', blank=True, null=True)
    content = models.TextField()
    rating = models.PositiveSmallIntegerField(default=5, help_text="Rating dari 1-5")
    
    # Options
    is_active = models.BooleanField(default=True)
    order_sequence = models.PositiveSmallIntegerField(default=1)
    
    # Timestamps
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['order_sequence', '-created_at']
        verbose_name = "Testimonial"
        verbose_name_plural = "Testimonial"
    
    def __str__(self):
        return self.name
