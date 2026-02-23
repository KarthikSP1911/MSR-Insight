import json
import os
from typing import Any


class DataNormalizer:
    """Utility to normalize scraped student data into the format required by AIService."""

    @staticmethod
    def normalize_student_record(scraped_record: dict[str, Any]) -> dict[str, Any]:
        """
        Converts a single scraped student record into a normalized format.
        Specifically maps 'current_semester' (with 'cie') to 'subjects' (with 'marks').
        """
        current_sem = scraped_record.get("current_semester", [])
        
        normalized_subjects = []
        for entry in current_sem:
            normalized_subjects.append({
                "code": entry.get("code", "N/A"),
                "name": entry.get("name", "Unknown Subject"),
                "marks": entry.get("cie", 0),  # Map cie -> marks
                "attendance": entry.get("attendance", 0)
            })
            
        return {
            "usn": scraped_record.get("usn"),
            "name": scraped_record.get("name"),
            "class_details": scraped_record.get("class_details"),
            "cgpa": scraped_record.get("cgpa"),
            "last_updated": scraped_record.get("last_updated"),
            "subjects": normalized_subjects
        }

    @staticmethod
    def normalize_all_data(input_file: str, output_file: str) -> dict[str, Any]:
        """Reads scraped data, normalizes it, and saves to a new file."""
        if not os.path.exists(input_file):
            return {}

        with open(input_file, "r") as f:
            scraped_data = json.load(f)

        normalized_data = {}
        for usn, record in scraped_data.items():
            normalized_data[usn] = DataNormalizer.normalize_student_record(record)

        with open(output_file, "w") as f:
            json.dump(normalized_data, f, indent=4)

        return normalized_data


if __name__ == "__main__":
    # Example usage for integration
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    SCRAPED_FILE = os.path.join(BASE_DIR, "all_students_report.json")
    NORMALIZED_FILE = os.path.join(BASE_DIR, "normalized_data.json")
    
    DataNormalizer.normalize_all_data(SCRAPED_FILE, NORMALIZED_FILE)
    print(f"Data normalized and saved to {NORMALIZED_FILE}")
