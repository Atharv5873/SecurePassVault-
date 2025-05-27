from pymongo import MongoClient
clinet=MongoClient("mongodb://localhost:27017/")
db=clinet["vault_db"]
vault_collection=db["collection"]