import json
import uuid
import datetime
from flask import Blueprint, request, jsonify, Flask, session
from bson.objectid import ObjectId
from pymongo.collection import ReturnDocument
import logging
from functools import wraps
from .auth import token_required
from .db import get_db
from ..transfers import process_transfer, get_user_by_private_address, get_user_balance
import time

# Create blueprint for quick transfer with a unique name
quicktransfer_bp = Blueprint('quick_transfer', __name__)

# Logger setup
logger = logging.getLogger(__name__)

# Maximum number of trusted contacts per user
MAX_TRUSTED_CONTACTS = 5

# Rate limiting settings
RATE_LIMIT_MAX_ATTEMPTS = 5
RATE_LIMIT_WINDOW = 60  # seconds

# Dictionary to store rate limiting data
rate_limit_data = {}

# Minimum time (in days) before a contact can be removed
MIN_DAYS_BEFORE_REMOVAL = 14

# Rate limiting decorator
def rate_limit(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        user_id = kwargs.get('user_id')
        if not user_id:
            return jsonify({
                "valid": False,
                "message": "Authentication required"
            }), 401

        current_time = time.time()
        user_rate_data = rate_limit_data.get(user_id, {
            'attempts': 0,
            'reset_time': current_time + RATE_LIMIT_WINDOW
        })

        # Reset rate limit if window has passed
        if current_time > user_rate_data.get('reset_time', 0):
            user_rate_data = {
                'attempts': 0,
                'reset_time': current_time + RATE_LIMIT_WINDOW
            }

        # Check if rate limit exceeded
        if user_rate_data['attempts'] >= RATE_LIMIT_MAX_ATTEMPTS:
            remaining_time = int(user_rate_data['reset_time'] - current_time)
            return jsonify({
                "valid": False,
                "message": f"Rate limit exceeded. Please try again in {remaining_time} seconds.",
                "rate_limited": True,
                "reset_time": user_rate_data['reset_time'],
                "remaining_time": remaining_time
            }), 429

        # لا نزيد العداد مسبقًا، سنزيده فقط إذا فشلت المحاولة
        # user_rate_data['attempts'] += 1
        
        # Execute the function
        response = func(*args, **kwargs)
        
        # Only count failed attempts towards rate limit
        if isinstance(response, tuple) and len(response) >= 2:
            status_code = response[1]
            response_json = response[0].json
            
            # إذا كان الرد يشير إلى فشل التحقق، نزيد العداد
            if status_code >= 400 or (isinstance(response_json, dict) and response_json.get('valid') is False):
                user_rate_data['attempts'] += 1
                logger.info(f"Failed validation attempt for user {user_id}. Attempts: {user_rate_data['attempts']}")
            else:
                logger.info(f"Successful validation for user {user_id}. Not counting against rate limit.")
        
        # Update rate limit data
        rate_limit_data[user_id] = user_rate_data

        # Add rate limit info to response
        if isinstance(response, tuple) and len(response) >= 2:
            response_json = response[0].json
            if isinstance(response_json, dict):
                response_json['rate_limit'] = {
                    'remaining': RATE_LIMIT_MAX_ATTEMPTS - user_rate_data['attempts'],
                    'reset_time': user_rate_data['reset_time'],
                    'window': RATE_LIMIT_WINDOW
                }
                response = (jsonify(response_json), response[1])
        
        return response
    
    return wrapper

@quicktransfer_bp.route('/api/quicktransfer/contacts', methods=['GET'])
@token_required
def get_trusted_contacts(user_id=None, **kwargs):
    """
    Get user's trusted contacts for quick transfer
    """
    try:
        db = get_db()
        
        # Find user's trusted contacts
        contacts = db.quick_transfer_contacts.find_one({"user_id": user_id})
        
        if contacts:
            # Add can_delete field to each contact based on added_at date
            contacts_list = contacts.get("contacts", [])
            current_time = datetime.datetime.utcnow()
            
            for contact in contacts_list:
                added_at = contact.get("added_at")
                if added_at:
                    # تحويل التاريخ إلى كائن datetime
                    if isinstance(added_at, str):
                        added_at = datetime.datetime.fromisoformat(added_at.replace('Z', '+00:00'))
                    elif isinstance(added_at, dict) and '$date' in added_at:
                        # تنسيق MongoDB
                        added_at_str = added_at['$date']
                        if isinstance(added_at_str, str):
                            # إذا كان التاريخ بتنسيق نصي
                            added_at = datetime.datetime.fromisoformat(added_at_str.replace('Z', '+00:00'))
                        else:
                            # إذا كان التاريخ بتنسيق timestamp (بالمللي ثانية)
                            added_at = datetime.datetime.fromtimestamp(added_at_str / 1000)
                    
                    # Debug logging
                    logger.info(f"Contact {contact.get('username')} added_at: {added_at}, current: {current_time}")
                    
                    # حساب عدد الأيام منذ الإضافة
                    days_since_addition = (current_time - added_at).days
                    logger.info(f"Days since addition: {days_since_addition}, threshold: {MIN_DAYS_BEFORE_REMOVAL}")
                    
                    # يمكن الحذف إذا مر 14 يوم أو أكثر منذ الإضافة
                    contact["can_delete"] = days_since_addition >= MIN_DAYS_BEFORE_REMOVAL
                    contact["days_remaining"] = max(0, MIN_DAYS_BEFORE_REMOVAL - days_since_addition)
                    
                    # إضافة تاريخ الإضافة بتنسيق مقروء
                    contact["added_at_formatted"] = added_at.strftime("%Y-%m-%d %H:%M:%S")
                else:
                    # إذا لم يكن هناك تاريخ إضافة، نسمح بالحذف
                    contact["can_delete"] = True
                    contact["days_remaining"] = 0
            
            return jsonify({
                "success": True,
                "contacts": contacts_list
            }), 200
        else:
            # Return empty list if no contacts found
            return jsonify({
                "success": True,
                "contacts": []
            }), 200
            
    except Exception as e:
        logger.error(f"Error retrieving trusted contacts: {str(e)}", exc_info=True)
        return jsonify({
            "success": False,
            "error": "Failed to retrieve trusted contacts"
        }), 500

@quicktransfer_bp.route('/api/user/private-address', methods=['GET'])
@token_required
def get_user_private_address(user_id=None, **kwargs):
    """
    Get the current user's private address
    """
    try:
        db = get_db()
        user = db.users.find_one({"user_id": user_id})
        
        if user and "private_address" in user:
            return jsonify({
                "success": True,
                "private_address": user["private_address"]
            }), 200
        else:
            return jsonify({
                "success": False,
                "error": "User private address not found"
            }), 404
    except Exception as e:
        logger.error(f"Error retrieving user private address: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Failed to retrieve user private address"
        }), 500

@quicktransfer_bp.route('/api/quicktransfer/contacts', methods=['POST'])
@token_required
def add_trusted_contact(user_id=None, **kwargs):
    """
    Add a trusted contact for quick transfers
    """
    try:
        data = request.get_json()
        private_address = data.get('private_address')
        
        if not private_address:
            return jsonify({
                "success": False,
                "error": "Private address is required"
            }), 400
            
        # Verify the private address exists in the system by checking the users collection directly
        db = get_db()
        contact_user = db.users.find_one({"private_address": private_address})
        
        if not contact_user:
            return jsonify({
                "success": False, 
                "error": "Invalid private address"
            }), 400
            
        # Don't allow adding yourself as a trusted contact
        if contact_user.get('user_id') == user_id:
            return jsonify({
                "success": False,
                "error": "Cannot add yourself as a trusted contact"
            }), 400
            
        # Check if user has reached the maximum number of trusted contacts
        contacts_doc = db.quick_transfer_contacts.find_one({"user_id": user_id})
        
        # الحصول على معلومات الصورة من مجموعة discord_users مباشرة باستخدام user_id
        contact_discord_id = contact_user.get("user_id")
        discord_user = db.discord_users.find_one({"user_id": contact_discord_id})
        
        avatar_url = None
        if discord_user and discord_user.get("avatar"):
            avatar_hash = discord_user.get("avatar")
            avatar_url = f"https://cdn.discordapp.com/avatars/{contact_discord_id}/{avatar_hash}.png?size=128"
            logger.info(f"Found Discord avatar for user {contact_discord_id}: {avatar_hash}")
        
        if contacts_doc:
            contacts = contacts_doc.get("contacts", [])
            
            # Check if contact already exists
            for contact in contacts:
                if contact.get("private_address") == private_address:
                    return jsonify({
                        "success": False,
                        "error": "Contact already exists"
                    }), 400
                    
            # Check if max limit reached
            if len(contacts) >= MAX_TRUSTED_CONTACTS:
                return jsonify({
                    "success": False,
                    "error": f"Maximum number of trusted contacts ({MAX_TRUSTED_CONTACTS}) reached"
                }), 400
                
            # Add new contact
            new_contact = {
                "id": str(uuid.uuid4()),
                "user_id": contact_user.get("user_id"),
                "username": contact_user.get("username"),
                "private_address": private_address,
                "public_address": contact_user.get("public_address"),
                "avatar": avatar_url,
                "discord_id": contact_discord_id,
                "avatar_hash": discord_user.get("avatar") if discord_user else None,
                "added_at": datetime.datetime.utcnow()
            }
            
            updated_doc = db.quick_transfer_contacts.find_one_and_update(
                {"user_id": user_id},
                {"$push": {"contacts": new_contact}},
                return_document=ReturnDocument.AFTER
            )
            
            return jsonify({
                "success": True,
                "contact": new_contact,
                "contacts": updated_doc.get("contacts", [])
            }), 200
            
        else:
            # First contact for this user
            new_contact = {
                "id": str(uuid.uuid4()),
                "user_id": contact_user.get("user_id"),
                "username": contact_user.get("username"),
                "private_address": private_address,
                "public_address": contact_user.get("public_address"),
                "avatar": avatar_url,
                "discord_id": contact_discord_id,
                "avatar_hash": discord_user.get("avatar") if discord_user else None,
                "added_at": datetime.datetime.utcnow()
            }
            
            db.quick_transfer_contacts.insert_one({
                "user_id": user_id,
                "contacts": [new_contact]
            })
            
            return jsonify({
                "success": True,
                "contact": new_contact,
                "contacts": [new_contact]
            }), 201
            
    except Exception as e:
        logger.error(f"Error adding trusted contact: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Failed to add trusted contact"
        }), 500

@quicktransfer_bp.route('/api/quicktransfer/contacts/<contact_id>', methods=['DELETE'])
@token_required
def delete_trusted_contact(contact_id, user_id=None, **kwargs):
    """
    Delete a trusted contact
    """
    try:
        db = get_db()
        
        # First, check if contact exists and get its added_at date
        contacts_doc = db.quick_transfer_contacts.find_one({"user_id": user_id})
        if not contacts_doc or "contacts" not in contacts_doc:
            return jsonify({
                "success": False,
                "error": "Contact not found"
            }), 404
        
        # Find the contact in the list
        contact_to_delete = None
        for contact in contacts_doc["contacts"]:
            if contact.get("id") == contact_id:
                contact_to_delete = contact
                break
        
        if not contact_to_delete:
            return jsonify({
                "success": False,
                "error": "Contact not found"
            }), 404
        
        # Re-enable the time check
        added_at = contact_to_delete.get("added_at")
        if added_at:
            # تحويل التاريخ إلى كائن datetime
            if isinstance(added_at, str):
                added_at = datetime.datetime.fromisoformat(added_at.replace('Z', '+00:00'))
            elif isinstance(added_at, dict) and '$date' in added_at:
                # تنسيق MongoDB
                added_at_str = added_at['$date']
                if isinstance(added_at_str, str):
                    # إذا كان التاريخ بتنسيق نصي
                    added_at = datetime.datetime.fromisoformat(added_at_str.replace('Z', '+00:00'))
                else:
                    # إذا كان التاريخ بتنسيق timestamp (بالمللي ثانية)
                    added_at = datetime.datetime.fromtimestamp(added_at_str / 1000)
            
            current_time = datetime.datetime.utcnow()
            days_since_addition = (current_time - added_at).days
            
            logger.info(f"Attempting to delete contact. Days since addition: {days_since_addition}, threshold: {MIN_DAYS_BEFORE_REMOVAL}")
            logger.info(f"Current time: {current_time}, Added at: {added_at}")
            
            if days_since_addition < MIN_DAYS_BEFORE_REMOVAL:
                return jsonify({
                    "success": False,
                    "error": f"Cannot remove contact yet. Contacts can only be removed after {MIN_DAYS_BEFORE_REMOVAL} days.",
                    "days_remaining": MIN_DAYS_BEFORE_REMOVAL - days_since_addition
                }), 403
        
        # Now delete the contact
        result = db.quick_transfer_contacts.update_one(
            {"user_id": user_id},
            {"$pull": {"contacts": {"id": contact_id}}}
        )
        
        if result.modified_count > 0:
            return jsonify({
                "success": True,
                "message": "Contact removed successfully"
            }), 200
        else:
            return jsonify({
                "success": False,
                "error": "Contact not found or could not be removed"
            }), 404
            
    except Exception as e:
        logger.error(f"Error deleting trusted contact: {str(e)}", exc_info=True)
        return jsonify({
            "success": False,
            "error": "Failed to delete trusted contact"
        }), 500

@quicktransfer_bp.route('/api/quicktransfer/transfer', methods=['POST'])
@token_required
def quick_transfer(user_id=None, **kwargs):
    """
    Process a quick transfer to a trusted contact
    """
    try:
        logger.info(f"Processing quick transfer for user_id: {user_id}")
        data = request.get_json()
        contact_id = data.get('contact_id')
        amount = data.get('amount')
        
        if not contact_id or not amount:
            logger.warning(f"Missing required parameters: contact_id={contact_id}, amount={amount}")
            return jsonify({
                "success": False,
                "error": "Contact ID and amount are required"
            }), 400
            
        # Validate amount
        try:
            amount = float(amount)
            if amount <= 0:
                logger.warning(f"Invalid amount: {amount}")
                return jsonify({
                    "success": False,
                    "error": "Amount must be positive"
                }), 400
                
            # Limit to 8 decimal places
            decimal_str = str(amount).split('.')
            if len(decimal_str) > 1 and len(decimal_str[1]) > 8:
                logger.warning(f"Amount has too many decimal places: {amount}")
                return jsonify({
                    "success": False,
                    "error": "Maximum of 8 decimal places allowed"
                }), 400
                
        except ValueError:
            logger.warning(f"Invalid amount format: {amount}")
            return jsonify({
                "success": False,
                "error": "Invalid amount"
            }), 400
            
        db = get_db()
        
        # Find the contact in user's trusted contacts
        logger.info(f"Looking for contact with ID {contact_id} for user {user_id}")
        contacts_doc = db.quick_transfer_contacts.find_one(
            {"user_id": user_id}
        )
        
        if not contacts_doc or not contacts_doc.get("contacts"):
            logger.warning(f"No trusted contacts found for user {user_id}")
            return jsonify({
                "success": False,
                "error": "No trusted contacts found"
            }), 404
            
        # Find the specific contact in the contacts array
        contact = None
        for c in contacts_doc["contacts"]:
            if c["id"] == contact_id:
                contact = c
                break
                
        if not contact:
            logger.warning(f"Contact with ID {contact_id} not found for user {user_id}")
            return jsonify({
                "success": False,
                "error": "Trusted contact not found"
            }), 404
            
        private_address = contact["private_address"]
        recipient_username = contact["username"]
        
        # Check user balance
        logger.info(f"Checking balance for user {user_id}")
        balance_info = get_user_balance(user_id)
        
        if not balance_info:
            logger.warning(f"Failed to get balance for user {user_id}")
            return jsonify({
                "success": False,
                "error": "Failed to get user balance"
            }), 500
            
        current_balance = float(balance_info)
        
        if current_balance < amount:
            logger.warning(f"Insufficient balance: {current_balance} < {amount}")
            return jsonify({
                "success": False,
                "error": "Insufficient balance"
            }), 400
            
        # Calculate new balance after transfer
        new_balance = current_balance - amount
        
        # Process the transfer without additional authentication
        logger.info(f"Processing transfer of {amount} from {user_id} to {private_address}")
        result = process_transfer(
            from_user_id=user_id, 
            to_private_address=private_address, 
            amount=str(amount),
            transfer_reason="Quick Transfer to " + recipient_username,
            skip_auth=True  # Skip additional authentication for quick transfers
        )
        
        if result.get('success'):
            transaction = result.get('transaction', {})
            tx_id = transaction.get('id')
            logger.info(f"Transfer successful: {tx_id}")
            return jsonify({
                "success": True,
                "tx_id": tx_id,
                "message": f"Successfully transferred {amount} CRN to {recipient_username}",
                "previous_balance": str(current_balance),
                "new_balance": str(new_balance)
            }), 200
        else:
            logger.error(f"Transfer failed: {result.get('error')}")
            return jsonify({
                "success": False,
                "error": result.get('error', "Transfer failed")
            }), 400
            
    except Exception as e:
        logger.error(f"Error processing quick transfer: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return jsonify({
            "success": False,
            "error": "Failed to process transfer"
        }), 500

@quicktransfer_bp.route('/api/quicktransfer/validate-address', methods=['POST'])
@token_required
@rate_limit
def validate_private_address(user_id=None, **kwargs):
    """
    Validate a private address for quick transfer
    """
    try:
        logger.info(f"Validating address for user_id: {user_id}")
        data = request.get_json()
        private_address = data.get('address')
        
        if not private_address:
            logger.warning("No private address provided in request")
            return jsonify({
                "valid": False,
                "message": "Private address is required"
            }), 400
            
        logger.info(f"Validating private address: {private_address[:8]}...")
            
        # Check directly in the users collection
        db = get_db()
        contact_user = db.users.find_one({"private_address": private_address})
        
        if not contact_user:
            logger.warning(f"Invalid private address: {private_address[:8]}...")
            return jsonify({
                "valid": False,
                "message": "The private address you entered is invalid or does not exist"
            }), 400
            
        # Don't allow adding yourself
        if contact_user.get('user_id') == user_id:
            logger.warning(f"User tried to add themselves as a contact: {user_id}")
            return jsonify({
                "valid": False,
                "message": "You cannot add your own address as a trusted contact"
            }), 400
            
        # Check if this contact is already in the user's trusted contacts
        existing_contact = db.quick_transfer_contacts.find_one({
            "user_id": user_id,
            "contacts.private_address": private_address
        })
        
        if existing_contact:
            logger.info(f"Contact already exists for user {user_id}")
            return jsonify({
                "valid": False,
                "message": "This contact is already in your trusted list"
            }), 400
            
        # Check if user has reached the maximum number of trusted contacts
        contacts_doc = db.quick_transfer_contacts.find_one({"user_id": user_id})
        if contacts_doc and len(contacts_doc.get("contacts", [])) >= MAX_TRUSTED_CONTACTS:
            logger.warning(f"User {user_id} has reached maximum contacts limit")
            return jsonify({
                "valid": False,
                "message": f"Maximum number of trusted contacts ({MAX_TRUSTED_CONTACTS}) reached"
            }), 400
            
        # الحصول على معلومات الصورة من مجموعة discord_users مباشرة باستخدام user_id
        contact_discord_id = contact_user.get("user_id")
        discord_user = db.discord_users.find_one({"user_id": contact_discord_id})
        
        avatar_url = None
        if discord_user and discord_user.get("avatar"):
            avatar_hash = discord_user.get("avatar")
            avatar_url = f"https://cdn.discordapp.com/avatars/{contact_discord_id}/{avatar_hash}.png?size=128"
            logger.info(f"Found Discord avatar for user {contact_discord_id}: {avatar_hash}")
            
        # Return user details
        logger.info(f"Valid address found for user {user_id}, contact: {contact_user.get('username')}")
        return jsonify({
            "valid": True,
            "username": contact_user.get("username"),
            "user_id": contact_user.get("user_id"),
            "avatar": avatar_url,
            "discord_id": contact_discord_id,
            "avatar_hash": discord_user.get("avatar") if discord_user else None,
            "message": "Valid address found"
        }), 200
            
    except Exception as e:
        logger.error(f"Error validating address: {str(e)}")
        return jsonify({
            "valid": False,
            "message": "The private address could not be verified. Please check your input and try again."
        }), 500

def init_routes(app: Flask):
    """
    Register all routes for quick transfer functionality
    """
    app.register_blueprint(quicktransfer_bp)
    return app 