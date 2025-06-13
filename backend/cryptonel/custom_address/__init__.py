from flask import Flask

def init_app(app: Flask):
    """
    Initialize Custom Address module for Cryptonel Wallet
    
    This module allows premium users to customize their private address
    """
    from .routes import register_routes
    
    # Register routes
    register_routes(app)
    
    return app 