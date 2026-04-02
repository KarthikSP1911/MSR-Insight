import json
import os
import requests
from typing import Any
from config.settings import settings

class SyncService:
    """Service to directly push normalized data into the Express API's JSONB storage."""

    @staticmethod
    def sync_to_express(normalized_record: dict[str, Any]):
        """Sends a single student record to the Express sync endpoint."""
        express_url = settings.EXPRESS_API_URL

        # The backend expects a student-keyed object for mapping USNs
        payload = {
            normalized_record["usn"]: normalized_record
        }

        try:
            print(f"[*] Syncing student {normalized_record['usn']} directly to Express...")
            response = requests.post(express_url, json=payload, timeout=30)
            
            if response.status_code in (200, 201):
                print(f"[+] Sync successful: Student {normalized_record['usn']} updated in PG.")
                return True
            else:
                print(f"[X] Sync failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            print(f"[X] Sync Error: {e}")
            return False
