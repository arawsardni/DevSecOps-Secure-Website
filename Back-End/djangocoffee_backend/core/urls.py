from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import api

urlpatterns = [
    # Site Configuration endpoints
    path('config/', api.site_configuration, name='site-config'),
    path('config/public/', api.public_site_configuration, name='public-site-config'),
    path('config/update/', api.update_site_configuration, name='update-site-config'),
    
    # Banner endpoints
    path('banners/', api.admin_banners_list, name='admin-banners-list'),
    path('banners/<uuid:banner_id>/', api.admin_banner_detail, name='admin-banner-detail'),
    path('banners/active/', api.active_banners, name='active-banners'),
    path('banners/create/', api.create_banner, name='create-banner'),
    path('banners/<uuid:banner_id>/update/', api.update_banner, name='update-banner'),
    path('banners/<uuid:banner_id>/delete/', api.delete_banner, name='delete-banner'),
    
    # Content Block endpoints
    path('content/', api.admin_content_blocks_list, name='admin-content-blocks-list'),
    path('content/<uuid:block_id>/', api.admin_content_block_detail, name='admin-content-block-detail'),
    path('content/slug/<slug:slug>/', api.content_block_by_slug, name='content-block-by-slug'),
    path('content/location/<str:location>/', api.content_blocks_by_location, name='content-blocks-by-location'),
    path('content/create/', api.create_content_block, name='create-content-block'),
    path('content/<uuid:block_id>/update/', api.update_content_block, name='update-content-block'),
    path('content/<uuid:block_id>/delete/', api.delete_content_block, name='delete-content-block'),
    
    # Contact Message endpoints
    path('contact/', api.admin_contact_messages_list, name='admin-contact-messages-list'),
    path('contact/<uuid:message_id>/', api.admin_contact_message_detail, name='admin-contact-message-detail'),
    path('contact/create/', api.create_contact_message, name='create-contact-message'),
    path('contact/<uuid:message_id>/reply/', api.reply_contact_message, name='reply-contact-message'),
    path('contact/<uuid:message_id>/mark-as-read/', api.mark_as_read, name='mark-as-read'),
    
    # FAQ endpoints
    path('faq/', api.admin_faqs_list, name='admin-faqs-list'),
    path('faq/<uuid:faq_id>/', api.admin_faq_detail, name='admin-faq-detail'),
    path('faq/public/', api.public_faqs, name='public-faqs'),
    path('faq/category/<str:category>/', api.faqs_by_category, name='faqs-by-category'),
    path('faq/create/', api.create_faq, name='create-faq'),
    path('faq/<uuid:faq_id>/update/', api.update_faq, name='update-faq'),
    path('faq/<uuid:faq_id>/delete/', api.delete_faq, name='delete-faq'),
    
    # Testimonial endpoints
    path('testimonials/', api.admin_testimonials_list, name='admin-testimonials-list'),
    path('testimonials/<uuid:testimonial_id>/', api.admin_testimonial_detail, name='admin-testimonial-detail'),
    path('testimonials/active/', api.active_testimonials, name='active-testimonials'),
    path('testimonials/create/', api.create_testimonial, name='create-testimonial'),
    path('testimonials/<uuid:testimonial_id>/update/', api.update_testimonial, name='update-testimonial'),
    path('testimonials/<uuid:testimonial_id>/delete/', api.delete_testimonial, name='delete-testimonial'),
] 