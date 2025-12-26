# backend/auth.py
import bcrypt
from datetime import datetime, timedelta
from jose import jwt

# Settings
SECRET_KEY = "super_secret_chrono_key_change_this_in_prod"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7

def get_password_hash(password: str) -> str:
    """
    Hashes a password using pure bcrypt.
    Automatically handles byte encoding to prevent crashes.
    """
    # 1. Convert string to bytes
    password_bytes = password.encode('utf-8')
    
    # 2. Generate salt and hash
    # bcrypt.hashpw returns bytes, so we decode to string for storage
    hashed = bcrypt.hashpw(password_bytes, bcrypt.gensalt())
    return hashed.decode('utf-8')

def verify_password(plain_password, hashed_password):
    """
    Checks if the plain password matches the hash.
    """
    try:
        # Convert both to bytes for comparison
        plain_bytes = plain_password.encode('utf-8')
        hashed_bytes = hashed_password.encode('utf-8')
        
        return bcrypt.checkpw(plain_bytes, hashed_bytes)
    except Exception as e:
        print(f"Verify Error: {e}")
        return False

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)