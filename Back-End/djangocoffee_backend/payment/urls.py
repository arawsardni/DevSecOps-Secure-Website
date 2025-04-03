from django.urls import path
from . import api

urlpatterns = [
    # Public endpoints
    path('methods/', api.payment_method_list, name='payment-method-list'),
    path('methods/<uuid:method_id>/', api.payment_method_detail, name='payment-method-detail'),
    
    # User endpoints
    path('', api.payment_list, name='payment-list'),
    path('<uuid:payment_id>/', api.payment_detail, name='payment-detail'),
    path('create/', api.create_payment, name='create-payment'),
    path('<uuid:payment_id>/upload-proof/', api.upload_payment_proof, name='upload-payment-proof'),
    path('<uuid:payment_id>/check-status/', api.check_payment_status, name='check-payment-status'),
    path('<uuid:payment_id>/cancel/', api.cancel_payment, name='cancel-payment'),
    path('<uuid:payment_id>/simulate-cash/', api.simulate_cash_payment, name='simulate-cash-payment'),
    
    # Admin endpoints
    path('admin/list/', api.admin_payment_list, name='admin-payment-list'),
    path('admin/<uuid:payment_id>/', api.admin_payment_detail, name='admin-payment-detail'),
    path('admin/<uuid:payment_id>/confirm/', api.admin_confirm_payment, name='admin-confirm-payment'),
    path('admin/<uuid:payment_id>/reject/', api.admin_reject_payment, name='admin-reject-payment'),
    path('admin/stats/', api.admin_payment_stats, name='admin-payment-stats'),
    path('admin/methods/create/', api.admin_create_payment_method, name='admin-create-payment-method'),
    path('admin/methods/<uuid:method_id>/update/', api.admin_update_payment_method, name='admin-update-payment-method'),
    path('admin/methods/<uuid:method_id>/bank-accounts/add/', api.admin_add_bank_account, name='admin-add-bank-account'),
    path('admin/bank-accounts/<uuid:bank_id>/delete/', api.admin_delete_bank_account, name='admin-delete-bank-account'),
] 