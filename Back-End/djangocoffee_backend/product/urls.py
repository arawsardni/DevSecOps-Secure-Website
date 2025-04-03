from django.urls import path
from . import api

urlpatterns = [
    # Product endpoints
    path('products/', api.products_list, name='api_products_list'),
    path('products/<uuid:product_id>/', api.product_detail, name='api_product_detail'),
    path('products/create/', api.create_product, name='api_create_product'),
    path('products/<uuid:product_id>/update/', api.update_product, name='api_update_product'),
    path('products/<uuid:product_id>/delete/', api.delete_product, name='api_delete_product'),
    path('products/featured/', api.featured_products, name='api_featured_products'),
    path('products/bestsellers/', api.bestseller_products, name='api_bestseller_products'),
    path('products/<uuid:product_id>/update-stock/', api.update_stock, name='api_update_stock'),
    
    # Category endpoints
    path('categories/', api.categories_list, name='api_categories_list'),
    path('categories/create/', api.create_category, name='api_create_category'),
    path('categories/<uuid:category_id>/update/', api.update_category, name='api_update_category'),
    path('categories/<uuid:category_id>/delete/', api.delete_category, name='api_delete_category'),
]