import json
import os
import re
import sys
from typing import Any

# Add the parent directory to sys.path to allow running this script directly
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config.settings import settings

class DataNormalizer:
    """Utility to normalize scraped student data into a clean, structured format."""

    @staticmethod
    def standardize_assessment_type(raw_name: str) -> str:
        """Standardizes assessment names to T1-T4, AQ1-AQ3, or FINAL CIE."""
        name = raw_name.upper().strip()
        
        if re.search(r'T\s*1', name) or name == "T1": return "T1"
        if re.search(r'T\s*2', name) or name == "T2": return "T2"
        if re.search(r'T\s*3', name) or name == "T3": return "T3"
        if re.search(r'T\s*4', name) or name == "T4": return "T4"
        
        if re.search(r'A/Q\s*1', name) or re.search(r'AQ\s*1', name): return "AQ1"
        if re.search(r'A/Q\s*2', name) or re.search(r'AQ\s*2', name): return "AQ2"
        if re.search(r'A/Q\s*3', name) or re.search(r'AQ\s*3', name): return "AQ3"
            
        if "FINAL" in name and "CIE" in name:
            return "FINAL CIE"
            
        return ""

    @staticmethod
    def is_valid_numeric(val: Any) -> bool:
        """Checks if a value is a valid numeric type."""
        if val is None:
            return False
        if isinstance(val, (int, float)):
            return True
        if isinstance(val, str):
            clean_val = val.strip()
            if clean_val == "" or clean_val == "-" or clean_val == " - ":
                return False
            try:
                float(clean_val)
                return True
            except ValueError:
                return False
        return False

    @staticmethod
    def normalize_student_record(scraped_record: dict[str, Any]) -> dict[str, Any]:
        """Converts a single scraped student record into the normalized format."""
        current_sem = scraped_record.get("current_semester", [])
        
        normalized_subjects = []
        for entry in current_sem:
            subject_code = entry.get("code", "N/A")
            subject_name = entry.get("name", "Unknown Subject")
            
            # Attendance Object
            att_details = entry.get("attendance_details", {})
            present = int(att_details.get("present_classes", 0))
            absent = int(att_details.get("absent_classes", 0))
            remaining = int(att_details.get("still_to_go", 0))
            
            total = present + absent
            percentage = round((present / total * 100)) if total > 0 else 0
            
            attendance_obj = {
                "present": present,
                "absent": absent,
                "remaining": remaining,
                "percentage": percentage
            }
            
            # Assessments
            cie_details = entry.get("cie_details", {})
            raw_tests = cie_details.get("tests", [])
            
            assessments = []
            for t in raw_tests:
                std_type = DataNormalizer.standardize_assessment_type(t.get("test_name", ""))
                if not std_type: continue
                
                obtained = t.get("marks_obtained")
                max_m = t.get("max_marks")
                
                if not DataNormalizer.is_valid_numeric(obtained): continue
                
                obtained_val = float(obtained)
                max_val = float(max_m) if DataNormalizer.is_valid_numeric(max_m) else 0
                
                if obtained_val == 0 and max_val == 0: continue
                
                assessments.append({
                    "type": std_type,
                    "obtained_marks": obtained_val,
                    "max_marks": max_val
                })
            
            # Calculate Total Marks (CIE)
            # Typically: Average of T1 & T2 (max 30) + AQ1 (max 10) + AQ2 (max 10) = 50
            def get_val(t_type) -> float:
                for a in assessments:
                    if a['type'] == t_type:
                        try:
                            return float(a['obtained_marks'])
                        except (ValueError, TypeError):
                            return 0.0
                return 0.0

            val_t1 = float(get_val("T1"))
            val_t2 = float(get_val("T2"))
            val_aq1 = float(get_val("AQ1"))
            val_aq2 = float(get_val("AQ2"))

            test_avg = float(round((val_t1 + val_t2) / 2)) if (val_t1 > 0 and val_t2 > 0) else float(max(val_t1, val_t2))
            total_marks = float(test_avg + val_aq1 + val_aq2)
            
            normalized_subjects.append({
                "code": str(subject_code),
                "name": str(subject_name),
                "marks": total_marks,
                "attendance": float(percentage),
                "attendance_details": attendance_obj,
                "assessments": assessments
            })
            
        return {
            "usn": scraped_record.get("usn"),
            "name": scraped_record.get("name"),
            "class_details": scraped_record.get("class_details"),
            "cgpa": scraped_record.get("cgpa"),
            "last_updated": scraped_record.get("last_updated"),
            "subjects": normalized_subjects,
            "exam_history": scraped_record.get("exam_history", [])
        }

    @staticmethod
    def normalize_all_data(input_file: str, output_file: str) -> dict[str, Any]:
        """Reads scraped data, normalizes it, and saves to a new file."""
        if not os.path.exists(input_file):
            return {}

        try:
            with open(input_file, "r") as f:
                scraped_data = json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            return {}

        normalized_data = {usn: DataNormalizer.normalize_student_record(record) for usn, record in scraped_data.items()}

        os.makedirs(os.path.dirname(output_file), exist_ok=True)
        with open(output_file, "w") as f:
            json.dump(normalized_data, f, indent=4)

        return normalized_data

if __name__ == "__main__":
    DataNormalizer.normalize_all_data(settings.SCRAPED_DATA_PATH, settings.NORMALIZED_DATA_PATH)
