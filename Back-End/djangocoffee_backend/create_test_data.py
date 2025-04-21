import os
import django
import uuid
from datetime import timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.utils import timezone
from order.models import Order, OrderItem
from product.models import Product
from django.contrib.auth import get_user_model

User = get_user_model()

def create_completed_order_for_user(user_email, num_orders=2):
    """
    Create completed orders for a user to populate data for product reviews
    """
    try:
        user = User.objects.get(email=user_email)
        print(f"Found user: {user.email} (ID: {user.id})")
        
        # Get some products
        products = Product.objects.all()[:5]
        if not products:
            print("No products found! Please create some products first.")
            return
        
        print(f"Found {len(products)} products")
        
        for i in range(num_orders):
            # Create a new completed order
            order = Order.objects.create(
                user=user,
                order_number=f"TST{i+10000}",
                total_amount=1000.00,
                status='completed',
                payment_status='paid',
                delivery_method='pickup',
                pickup_location='Test Store',
                completed_at=timezone.now() - timedelta(days=i+1)
            )
            
            print(f"Created order #{order.order_number}")
            
            # Add 2-3 items to the order
            for j, product in enumerate(products[:3]):
                # Create order item
                item = OrderItem.objects.create(
                    order=order,
                    product=product,
                    quantity=1,
                    price=product.price or 10000.00
                )
                print(f"  - Added product: {product.name}")
                
        print(f"Created {num_orders} completed orders with items for {user.email}")
        
    except User.DoesNotExist:
        print(f"User with email {user_email} not found!")
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    # Replace with your test user's email
    USER_EMAIL = "admin@example.com"
    create_completed_order_for_user(USER_EMAIL, 3)
    
    print("\nTest data creation completed!") 