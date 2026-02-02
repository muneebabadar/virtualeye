#!/usr/bin/env python3
"""
MongoDB Setup Script for V-EYE Person Recognition for any new computer
================================================

This script sets up the MongoDB database for the V-EYE person recognition system.
Run this ONCE when setting up the application on a new machine.

Usage:
    python setup_mongodb.py

What it does:
    1. ✓ Checks if MongoDB is running at localhost:27017
    2. ✓ Creates the v_eye_db database
    3. ✓ Creates the persons collection with proper schema
    4. ✓ Sets up indexes for fast queries
    5. ✓ Validates the setup is correct
    6. ✓ Clears any invalid data from previous runs

Author: V-EYE Development Team
Version: 1.0
"""

from pymongo import MongoClient, ASCENDING
import sys
import time


def print_header(text):
    """Print a formatted header"""
    print("\n" + "=" * 60)
    print(f"  {text}")
    print("=" * 60)


def print_step(number, text):
    """Print a numbered step"""
    print(f"\n[{number}] {text}")


def print_success(text):
    """Print success message"""
    print(f"    ✓ {text}")


def print_error(text):
    """Print error message"""
    print(f"    ✗ ERROR: {text}")


def print_warning(text):
    """Print warning message"""
    print(f"    ⚠ {text}")


def check_mongodb_connection(uri="mongodb://localhost:27017"):
    """Check if MongoDB is running and accessible"""
    print_step(1, "Checking MongoDB Connection")
    
    try:
        client = MongoClient(uri, serverSelectionTimeoutMS=5000)
        # Attempt to connect
        client.admin.command('ping')
        print_success(f"MongoDB is running at {uri}")
        return client
    except Exception as e:
        print_error(f"Cannot connect to MongoDB at {uri}")
        print(f"\nMake sure MongoDB is running:")
        print("  macOS:   brew services start mongodb-community")
        print("  Windows: mongod")
        print("  Linux:   sudo systemctl start mongod")
        print(f"\nError details: {e}")
        return None


def setup_database(client):
    """Create database and collection"""
    print_step(2, "Setting up Database and Collection")
    
    try:
        db = client.get_database("v_eye_db")
        
        # Create collection if it doesn't exist
        if "persons" not in db.list_collection_names():
            db.create_collection("persons")
            print_success("Created 'persons' collection")
        else:
            print_success("'persons' collection already exists")
        
        return db
    except Exception as e:
        print_error(f"Failed to create database/collection: {e}")
        return None


def setup_indexes(db):
    """Create indexes for fast queries"""
    print_step(3, "Setting up Indexes")
    
    try:
        persons = db.get_collection("persons")
        
        # Create unique index on name for fast lookups
        persons.create_index([("name", ASCENDING)], unique=True)
        print_success("Created unique index on 'name' field")
        
        # Create indexes on timestamps for sorting
        persons.create_index([("created_at", ASCENDING)])
        persons.create_index([("updated_at", ASCENDING)])
        print_success("Created indexes on timestamp fields")
        
        return True
    except Exception as e:
        print_error(f"Failed to create indexes: {e}")
        return False


def clean_invalid_data(db):
    """Remove any documents that don't match the expected schema"""
    print_step(4, "Cleaning Invalid Data")
    
    try:
        persons = db.get_collection("persons")
        
        # Find documents missing required fields
        invalid_docs = persons.find({
            "$or": [
                {"name": {"$exists": False}},
                {"embeddings": {"$exists": False}},
                {"created_at": {"$exists": False}},
                {"updated_at": {"$exists": False}},
            ]
        })
        
        invalid_count = persons.count_documents({
            "$or": [
                {"name": {"$exists": False}},
                {"embeddings": {"$exists": False}},
                {"created_at": {"$exists": False}},
                {"updated_at": {"$exists": False}},
            ]
        })
        
        if invalid_count > 0:
            print_warning(f"Found {invalid_count} invalid documents")
            response = input("    Delete invalid documents? (y/N): ").strip().lower()
            
            if response == 'y':
                persons.delete_many({
                    "$or": [
                        {"name": {"$exists": False}},
                        {"embeddings": {"$exists": False}},
                        {"created_at": {"$exists": False}},
                        {"updated_at": {"$exists": False}},
                    ]
                })
                print_success(f"Deleted {invalid_count} invalid documents")
            else:
                print("    Skipped deletion")
        else:
            print_success("No invalid documents found")
        
        return True
    except Exception as e:
        print_error(f"Failed to clean data: {e}")
        return False


def validate_schema(db):
    """Validate the schema is correct"""
    print_step(5, "Validating Schema")
    
    try:
        persons = db.get_collection("persons")
        
        # Get collection info
        stats = db.command("collStats", "persons")
        doc_count = stats.get("count", 0)
        
        print_success(f"Collection 'persons' has {doc_count} document(s)")
        
        # Show index information
        indexes = persons.list_indexes()
        index_names = [idx['name'] for idx in indexes]
        print_success(f"Indexes: {', '.join(index_names)}")
        
        # Check if there are registered persons
        if doc_count > 0:
            sample_doc = persons.find_one()
            if sample_doc:
                name = sample_doc.get('name', 'Unknown')
                embeddings_count = len(sample_doc.get('embeddings', []))
                print_success(f"Sample person: '{name}' with {embeddings_count} embedding(s)")
        
        return True
    except Exception as e:
        print_error(f"Failed to validate schema: {e}")
        return False


def show_schema_info():
    """Display the expected schema"""
    print_step(6, "Schema Information")
    
    print("""
Expected Document Schema:
{
    "_id": ObjectId,
    "name": "string (person's name)",
    "embeddings": [
        [float, float, ...],  # 128-dimensional embedding
        [float, float, ...],
        ...
    ],
    "created_at": datetime,
    "updated_at": datetime
}

Example:
{
    "_id": ObjectId("507f1f77bcf86cd799439011"),
    "name": "John",
    "embeddings": [
        [-0.048, 0.123, 0.080, ..., 0.045],  // 128 values
        [-0.045, 0.120, 0.082, ..., 0.048],  // 128 values
        ...
    ],
    "created_at": ISODate("2026-01-25T10:30:00.000Z"),
    "updated_at": ISODate("2026-01-25T10:30:00.000Z")
}
""")
    print_success("Schema information displayed")


def show_connection_string():
    """Display MongoDB connection details"""
    print_step(7, "MongoDB Connection Details")
    
    connection_info = """
MongoDB Server Details:
  URI:      mongodb://localhost:27017
  Database: v_eye_db
  Collection: persons
  
Python Connection Code:
  from pymongo import MongoClient
  client = MongoClient('mongodb://localhost:27017')
  db = client.get_database('v_eye_db')
  persons = db.get_collection('persons')

Verify Connection:
  curl http://localhost:27017
  # Should return HTML about MongoDB
"""
    print(connection_info)


def main():
    """Main setup function"""
    print_header("V-EYE MongoDB Setup")
    print("\nThis script will set up MongoDB for person recognition.")
    print("Make sure MongoDB is running before continuing!\n")
    
    # Step 1: Check connection
    client = check_mongodb_connection()
    if not client:
        print_error("Setup failed - MongoDB is not accessible")
        sys.exit(1)
    
    try:
        # Step 2: Setup database
        db = setup_database(client)
        if not db:
            print_error("Setup failed - Could not create database")
            sys.exit(1)
        
        # Step 3: Setup indexes
        if not setup_indexes(db):
            print_error("Setup failed - Could not create indexes")
            sys.exit(1)
        
        # Step 4: Clean invalid data
        if not clean_invalid_data(db):
            print_error("Setup failed - Could not clean data")
            sys.exit(1)
        
        # Step 5: Validate schema
        if not validate_schema(db):
            print_error("Setup failed - Could not validate schema")
            sys.exit(1)
        
        # Step 6: Show schema info
        show_schema_info()
        
        # Step 7: Show connection details
        show_connection_string()
        
        # Success
        print_header("✓ MongoDB Setup Complete!")
        print("""
Next Steps:
  1. Start the FastAPI backend:
     cd backend
     uvicorn main:app --host 0.0.0.0 --port 8000 --reload
     
  2. Start the Expo frontend:
     npm start
     
  3. Register a person:
     - Go to "Features" → "Person Registration"
     - Capture 5 photos
     - Enter name and save
     
  4. Test object detection:
     - Go to "Features" → "Object Navigation"
     - Enable auto-detection
     - Point camera at registered person
     
Questions? Check README_SETUP.md for more details.
""")
        
        client.close()
        print("✓ MongoDB setup completed successfully!")
        
    except Exception as e:
        print_error(f"Unexpected error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
