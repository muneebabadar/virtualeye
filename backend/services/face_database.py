from typing import List, Optional
import os
from datetime import datetime

from pymongo import MongoClient
from pymongo.collection import Collection


class DuplicateName(Exception):
    """Raised when a person with the same name already exists."""
    pass


def get_mongo_client(uri: Optional[str] = None) -> MongoClient:
    mongo_uri = uri or os.environ.get("MONGO_URI", "mongodb://localhost:27017")
    client = MongoClient(mongo_uri)
    return client


def get_persons_collection(client: MongoClient) -> Collection:
    db = client.get_database("v_eye_db")
    persons = db.get_collection("persons")
    try:
        persons.create_index("name", unique=True)
    except Exception:
        # Index may already exist
        pass
    return persons


def save_person_profile(
    name: str,
    embeddings: List[List[float]],
    client: Optional[MongoClient] = None
) -> dict:
    """
    Save a new person profile.

    Raises DuplicateName if a person with the same name exists.
    Returns the inserted document (as dict).
    """
    if client is None:
        client = get_mongo_client()
    persons = get_persons_collection(client)

    existing = persons.find_one({"name": name})
    if existing:
        raise DuplicateName(f"Name already exists: {name}")

    # Store all required fields including timestamps
    now = datetime.utcnow()
    doc = {
        "name": name,
        "embeddings": embeddings,
        "created_at": now,
        "updated_at": now,
    }

    result = persons.insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc


def get_all_persons(client: Optional[MongoClient] = None) -> List[dict]:
    """Return all person documents from the DB."""
    if client is None:
        client = get_mongo_client()
    persons = get_persons_collection(client)
    return list(persons.find({}))


def find_person_by_name(
    name: str,
    client: Optional[MongoClient] = None
) -> Optional[dict]:
    if client is None:
        client = get_mongo_client()
    persons = get_persons_collection(client)
    return persons.find_one({"name": name})
