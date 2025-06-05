from pymongo import MongoClient
from config import MONGODB_URI

client = MongoClient("mongodb://vault_user:atharv5873@localhost:27017/vault_db")
db = client["vault_db"]
vault_collection = db["collection"]
