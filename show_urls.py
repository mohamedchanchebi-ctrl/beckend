import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE','config.settings')
import django
django.setup()

from django.urls import get_resolver

def show_urls(resolver, prefix=''):
    for p in resolver.url_patterns:
        if hasattr(p, 'url_patterns'):
            show_urls(p, prefix + str(p.pattern))
        else:
            print(prefix + str(p.pattern))

show_urls(get_resolver())
