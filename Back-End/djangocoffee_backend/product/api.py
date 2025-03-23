from django.http import JsonResponse

from rest_framework.decorators import api_view, authentication_classes, permission_classes

from .models import Product
from .serializers import ProductListSerializer, ProductDetailSerializer

@api_view(['GET'])
@authentication_classes([])
@permission_classes([])
def products_list(request):
    products = Product.objects.all()
    serializer = ProductListSerializer(products, many=True)

    return JsonResponse({
        'data' : serializer.data
        })

@api_view(['GET'])
@authentication_classes([])
@permission_classes([])
def product_detail(request, product_id):
    try:
        product = Product.objects.get(id=product_id)
        serializer = ProductDetailSerializer(product)
        return JsonResponse({'data': serializer.data})
    except Product.DoesNotExist:
        return JsonResponse({'error': 'Product not found'}, status=404)
