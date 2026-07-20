import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from catalog.models import Category, Product, ProductVariant

# Clear existing test data
Product.objects.all().delete()
Category.objects.all().delete()

# Create Categories
diecut = Category.objects.create(name='Die-Cut Stickers', slug='die-cut')
holographic = Category.objects.create(name='Holographic Stickers', slug='holographic')

# Define Products
products_data = [
    {
        'name': 'Cyberpunk Cat',
        'category': diecut,
        'base_price': 4.99,
        'description': 'A vibrant die-cut sticker of a cyberpunk cat wearing neon glowing VR goggles.',
        'image': '/images/cyberpunk_cat.png',
        'sku_base': 'CYBER-CAT'
    },
    {
        'name': 'Holographic Skull',
        'category': holographic,
        'base_price': 6.50,
        'description': 'Cool stylized human skull with iridescent shiny textures.',
        'image': '/images/holographic_skull.png',
        'sku_base': 'HOLO-SKULL'
    },
    {
        'name': 'Vaporwave Sunset',
        'category': diecut,
        'base_price': 5.00,
        'description': 'Synthwave retro vaporwave 80s outrun sunset over a grid landscape.',
        'image': '/images/vaporwave_sunset.png',
        'sku_base': 'VAPOR-SUN'
    },
    {
        'name': 'Cute Astronaut',
        'category': diecut,
        'base_price': 4.50,
        'description': 'Adorable chibi astronaut floating with a balloon shaped like a planet.',
        'image': '/images/cute_astronaut.png',
        'sku_base': 'CUTE-ASTRO'
    },
    {
        'name': 'Minimalist Coffee',
        'category': diecut,
        'base_price': 4.00,
        'description': 'Minimalist modern line-art coffee cup with abstract geometric shapes.',
        'image': '/images/minimalist_coffee.png',
        'sku_base': 'MINI-COFFEE'
    }
]

for pdata in products_data:
    prod = Product.objects.create(
        name=pdata['name'],
        category=pdata['category'],
        base_price=pdata['base_price'],
        description=pdata['description'],
        images=[pdata['image']]
    )
    
    # Create variants
    ProductVariant.objects.create(product=prod, size='Small (2x2")', material='Vinyl', finish='Matte', price_modifier=0.00, stock_qty=100, sku=f"{pdata['sku_base']}-SM")
    ProductVariant.objects.create(product=prod, size='Large (4x4")', material='Vinyl', finish='Glossy', price_modifier=2.00, stock_qty=50, sku=f"{pdata['sku_base']}-LG")

print(f"Seeded {len(products_data)} products successfully!")

