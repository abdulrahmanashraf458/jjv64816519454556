"""
Network Transactions Handler
---------------------------
Handles fetching and streaming of public network transactions
"""

import os
import json
import logging
import asyncio
import time
import datetime
from bson import ObjectId
from flask import Blueprint, jsonify, request, current_app
from flask_socketio import SocketIO, emit
from pymongo import MongoClient, DESCENDING
from pymongo.errors import PyMongoError

# Setup logging
logger = logging.getLogger(__name__)

# Create Blueprint
network_transactions_bp = Blueprint('network_transactions', __name__)

# MongoDB connection and collection access
def get_db_connection():
    try:
        # Get MongoDB connection string from environment
        mongo_uri = os.environ.get('DATABASE_URL')
        if not mongo_uri:
            logger.error("DATABASE_URL environment variable not set")
            return None
            
        # Create client and connect to specific database
        client = MongoClient(mongo_uri)
        db = client['cryptonel_wallet']
        return db
    except Exception as e:
        logger.error(f"Database connection error: {str(e)}")
        return None

def get_transactions_collection():
    db = get_db_connection()
    if db is not None:
        return db['user_transactions']
    return None

# Helper function to format transaction for public display
def format_transaction_for_public(transaction):
    # Determine if it's a sent or received transaction
    transaction_type = transaction.get('type')
    
    if transaction_type == 'sent':
        sender_address = transaction.get('counterparty_public_address', 'Unknown')
        sender_username = transaction.get('counterparty_username', 'Unknown')
        receiver_address = transaction.get('sender_id', 'Unknown')
        receiver_username = transaction.get('sender_username', 'Unknown')
    else:  # received
        sender_address = transaction.get('counterparty_public_address', 'Unknown')
        sender_username = transaction.get('counterparty_username', 'Unknown')
        receiver_address = transaction.get('recipient_id', 'Unknown')
        receiver_username = transaction.get('recipient_username', 'Unknown')
    
    # Format timestamp
    timestamp = transaction.get('timestamp')
    if isinstance(timestamp, datetime.datetime):
        formatted_time = timestamp.strftime('%Y-%m-%d %H:%M:%S')
    else:
        formatted_time = str(timestamp)
    
    # Return formatted transaction
    return {
        'tx_id': transaction.get('tx_id', 'Unknown'),
        'amount': float(transaction.get('amount', 0)),
        'timestamp': formatted_time,
        'sender': {
            'public_address': sender_address,
            'username': sender_username
        },
        'receiver': {
            'public_address': receiver_address,
            'username': receiver_username
        },
        'status': transaction.get('status', 'Unknown')
    }

# Custom JSON encoder to handle ObjectId
class MongoJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        if isinstance(obj, datetime.datetime):
            return obj.isoformat()
        return json.JSONEncoder.default(self, obj)

# API endpoint to get recent transactions
@network_transactions_bp.route('/api/network-transactions', methods=['GET'])
def get_network_transactions():
    try:
        # Get pagination parameters
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))
        
        # Calculate skip value for pagination
        skip = (page - 1) * limit
        
        # Get collection
        transactions_collection = get_transactions_collection()
        if transactions_collection is None:
            return jsonify({'error': 'Database connection error'}), 500
        
        # Fetch all user documents with their transactions
        all_transactions = []
        user_docs = list(transactions_collection.find({}, {'transactions': 1}))
        
        # Extract all transactions from all users
        for user_doc in user_docs:
            if 'transactions' in user_doc:
                for tx in user_doc['transactions']:
                    # Add only completed transactions
                    if tx.get('status') == 'completed':
                        all_transactions.append(tx)
        
        # Sort transactions by timestamp
        all_transactions.sort(key=lambda x: x.get('timestamp', datetime.datetime.min), reverse=True)
        
        # Apply pagination
        paginated_transactions = all_transactions[skip:skip+limit]
        
        # Format transactions for public display
        formatted_transactions = [format_transaction_for_public(tx) for tx in paginated_transactions]
        
        # Return response
        return jsonify({
            'transactions': formatted_transactions,
            'meta': {
                'page': page,
                'limit': limit,
                'total': len(all_transactions),
                'pages': (len(all_transactions) + limit - 1) // limit
            }
        })
    
    except Exception as e:
        logger.error(f"Error fetching network transactions: {str(e)}")
        return jsonify({'error': 'An error occurred while fetching network transactions'}), 500

# WebSocket setup for real-time updates
def setup_socketio(socketio):
    @socketio.on('connect', namespace='/network-transactions')
    def handle_connect():
        logger.info("Client connected to network transactions socket")
    
    @socketio.on('disconnect', namespace='/network-transactions')
    def handle_disconnect():
        logger.info("Client disconnected from network transactions socket")

# Background task to check for new transactions and emit updates
async def check_for_new_transactions(socketio):
    try:
        last_check_time = datetime.datetime.now() - datetime.timedelta(minutes=5)
        
        while True:
            try:
                # Get collection
                transactions_collection = get_transactions_collection()
                
                if transactions_collection is not None:
                    # Fetch all user documents with transactions newer than last check
                    new_transactions = []
                    
                    user_docs = list(transactions_collection.find({}, {'transactions': 1}))
                    
                    # Extract all transactions from all users that are newer than last check
                    for user_doc in user_docs:
                        if 'transactions' in user_doc:
                            for tx in user_doc['transactions']:
                                tx_time = tx.get('timestamp')
                                if tx_time and tx_time > last_check_time and tx.get('status') == 'completed':
                                    new_transactions.append(tx)
                    
                    # Update last check time
                    last_check_time = datetime.datetime.now()
                    
                    # If there are new transactions, format and emit them
                    if new_transactions:
                        # Sort by timestamp
                        new_transactions.sort(key=lambda x: x.get('timestamp', datetime.datetime.min), reverse=True)
                        
                        # Format for public display
                        formatted_transactions = [format_transaction_for_public(tx) for tx in new_transactions]
                        
                        # Emit to all connected clients
                        socketio.emit('new_transactions', 
                                    {'transactions': formatted_transactions}, 
                                    namespace='/network-transactions')
                        
                        logger.info(f"Emitted {len(formatted_transactions)} new transactions")
            
            except Exception as e:
                logger.error(f"Error in transaction check loop: {str(e)}")
            
            # Sleep before next check (5 seconds)
            await asyncio.sleep(5)
    
    except asyncio.CancelledError:
        logger.info("Transaction check task cancelled")
    except Exception as e:
        logger.error(f"Unexpected error in transaction check loop: {str(e)}")

# Main initialization function
def init_app(app):
    # Register blueprint
    app.register_blueprint(network_transactions_bp)
    
    # Register JSON encoder for MongoDB objects
    app.json_encoder = MongoJSONEncoder
    
    # Setup SocketIO if available on the app
    if hasattr(app, 'socketio'):
        socketio = app.socketio
        setup_socketio(socketio)
        
        # Start background task for checking new transactions
        @app.before_first_request
        def start_transaction_check():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            # Create and run the task
            transaction_check_task = loop.create_task(check_for_new_transactions(socketio))
            
            # Store task in app context to prevent garbage collection
            app.transaction_check_task = transaction_check_task
    
    logger.info("Network transactions module initialized")
    return network_transactions_bp 