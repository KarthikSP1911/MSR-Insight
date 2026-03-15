import json
import requests
import os
from config.settings import settings

class SyncService:
    """Service to sync normalized student data to the Express API."""

    @staticmethod
    def sync_to_express(normalized_file: str = None, express_url: str = None):
        """Reads normalized JSON and sends it to Express."""
        if normalized_file is None:
            normalized_file = settings.NORMALIZED_DATA_PATH
        
        if express_url is None:
            express_url = settings.EXPRESS_API_URL

        if not os.path.exists(normalized_file):
            print(f"[!] Sync Error: {normalized_file} not found.")
            return False

        try:
            with open(normalized_file, "r") as f:
                data = json.load(f)

            print(f"[*] Syncing data to Express ({express_url})...")
            response = requests.post(express_url, json=data, timeout=30)
            
            if response.status_code == 200:
                print("[+] Sync successful: All records updated in PostgreSQL.")
                return True
            elif response.status_code == 207:
                print(f"[!] Sync partial success: {response.json().get('message')}")
                return True
            else:
                print(f"[X] Sync failed: Status {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"[X] Sync Error: {e}")
            return False

if __name__ == "__main__":
    SyncService.sync_to_express()
