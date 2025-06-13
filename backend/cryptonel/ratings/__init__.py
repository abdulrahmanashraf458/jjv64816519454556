from flask import Blueprint, jsonify, request
from backend.db_connection import db
from datetime import datetime
import logging

# Set up logger
logger = logging.getLogger("ratings")

users_collection = db["users"]
ratings_collection = db["user_ratings"]
discord_users_collection = db["discord_users"]

public_profile_bp = Blueprint("public_profile", __name__)


def _serialize_timestamp(ts):
    """Helper to convert various timestamp formats to ISO strings"""
    if isinstance(ts, datetime):
        return ts.isoformat()
    if isinstance(ts, dict) and "$date" in ts:
        return ts["$date"]
    if isinstance(ts, str):
        return ts
    return None


@public_profile_bp.route("/api/public-profile/<username>", methods=["GET"])
def get_public_profile(username):
    """Return public profile data + ratings for a given username"""
    try:
        logger.info(f"Fetching public profile for username: {username}")
        
        # Fetch basic user data (publicly safe fields only)
        user_doc = users_collection.find_one(
            {"username": username},
            {
                "_id": 0,
                "user_id": 1,
                "username": 1,
                "avatar": 1,
                "premium": 1,
                "vip": 1,
                "verified": 1,
                "account_type": 1,
            },
        )

        if not user_doc:
            logger.warning(f"User not found: {username}")
            return jsonify({"success": False, "error": "User not found"}), 404

        logger.info(f"Found user: {user_doc.get('username')} (ID: {user_doc.get('user_id')}, Avatar: {user_doc.get('avatar')})")

        # Fetch ratings document for the user_id
        ratings_doc = ratings_collection.find_one({"user_id": user_doc["user_id"]}, {"_id": 0})
        if not ratings_doc:
            logger.info(f"No ratings found for user: {user_doc.get('user_id')}")
            ratings_doc = {
                "total_ratings": 0,
                "average_rating": 0,
                "ratings": [],
            }
        else:
            logger.info(f"Found {len(ratings_doc.get('ratings', []))} ratings for user")
            # Serialize timestamps for JSON
            for r in ratings_doc.get("ratings", []):
                if "timestamp" in r:
                    r["timestamp"] = _serialize_timestamp(r["timestamp"])

        return jsonify({"success": True, "user": user_doc, "ratings": ratings_doc})
    except Exception as e:
        logger.error(f"Error fetching profile: {e}", exc_info=True)
        return jsonify({"success": False, "error": "Internal server error"}), 500


@public_profile_bp.route("/api/discord-users", methods=["GET"])
def get_discord_users():
    """Get Discord user info (avatars) for multiple users by IDs"""
    try:
        # Get comma-separated list of user IDs
        user_ids = request.args.get("ids", "").split(",")
        
        # Filter out empty strings
        user_ids = [uid for uid in user_ids if uid]
        
        logger.info(f"Fetching Discord users for IDs: {user_ids}")
        
        if not user_ids:
            return jsonify({"success": False, "error": "No user IDs provided"}), 400
            
        # Fetch user documents from discord_users collection
        users = list(discord_users_collection.find(
            {"user_id": {"$in": user_ids}},
            {"_id": 0, "user_id": 1, "avatar": 1, "username": 1}
        ))
        
        logger.info(f"Found {len(users)} users in discord_users collection")
        
        # If no users found in discord_users, try the main users collection
        if not users:
            logger.info("No users found in discord_users, checking main users collection")
            users = list(users_collection.find(
                {"user_id": {"$in": user_ids}},
                {"_id": 0, "user_id": 1, "avatar": 1, "username": 1}
            ))
            logger.info(f"Found {len(users)} users in main users collection")
        
        # Log the avatar data for debugging
        for user in users:
            logger.info(f"User avatar data: ID={user.get('user_id')}, avatar={user.get('avatar')}")
        
        return jsonify({
            "success": True,
            "users": users
        })
    except Exception as e:
        logger.error(f"Error fetching discord users: {e}", exc_info=True)
        return jsonify({"success": False, "error": "Internal server error"}), 500


def init_app(app):
    """Register blueprint with the main Flask app"""
    # Configure logging
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)
    
    logger.info("Registering public_profile blueprint")
    app.register_blueprint(public_profile_bp) 