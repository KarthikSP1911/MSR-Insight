import time
import json
import re
import os
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select
from bs4 import BeautifulSoup



# --- CONFIGURATION ---
BRAVE_PATH = "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"
JSON_STORAGE = "all_students_report.json"

def get_complete_student_data(usn, day, month, year):
    options = Options()
    options.binary_location = BRAVE_PATH
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    # options.add_argument("--headless") # Uncomment to hide browser

    driver = webdriver.Chrome(options=options)
    
    try:
        print(f"[*] Accessing portal for USN: {usn}...")
        driver.get("https://parents.msrit.edu/newparents/")
        
        # 1. Login Logic
        driver.find_element(By.ID, "username").send_keys(usn)
        Select(driver.find_element(By.ID, "dd")).select_by_value(f"{day} ") 
        Select(driver.find_element(By.ID, "mm")).select_by_value(month)
        Select(driver.find_element(By.ID, "yyyy")).select_by_value(year)
        
        login_btn = driver.find_element(By.CLASS_NAME, "cn-login-btn")
        driver.execute_script("arguments[0].click();", login_btn)
        time.sleep(7) 

        if "dashboard" not in driver.current_url.lower() and "Logout" not in driver.page_source:
            print("[!] Login failed.")
            return None

        # 2. Capture Dashboard (Attendance/CIE)
        print("[+] Scraped Dashboard.")
        dashboard_html = driver.page_source

        # 3. Capture Exam History (CGPA/SGPA)
        print("[*] Navigating to Exam Results...")
        driver.get("https://parents.msrit.edu/newparents/index.php?option=com_history&task=getResult")
        time.sleep(5)
        exam_history_html = driver.page_source

        return {"dashboard": dashboard_html, "exams": exam_history_html}

    except Exception as e:
        print(f"[X] Automation Error: {e}")
        return None
    finally:
        driver.quit()

def parse_and_save_data(scraped_data):

    # --- A. PARSE DASHBOARD (Current Sem Data) ---
    soup_dash = BeautifulSoup(scraped_data['dashboard'], "html.parser")
    name = soup_dash.find("h3").get_text(strip=True) if soup_dash.find("h3") else "Unknown"
    usn = soup_dash.find("h2").get_text(strip=True) if soup_dash.find("h2") else "Unknown"
    class_info = soup_dash.find("p").get_text(strip=True) if soup_dash.find("p") else ""

    # Subject Map (Code -> Name)
    subject_map = {}
    for row in soup_dash.find_all("tr"):
        cols = row.find_all("td")
        if len(cols) >= 2:
            code = cols[0].get_text(strip=True)
            if re.match(r"^[0-9A-Z]{5,10}$", code):
                subject_map[code] = cols[1].get_text(strip=True)

    # CIE & Attendance from JS
    cie_data, att_data = {}, {}
    pattern = r'\["([A-Z0-9]+)",\s*(\d+)\]'
    for script in soup_dash.find_all("script"):
        if script.string:
            if "#barPadding" in script.string:
                cie_data = {code: int(val) for code, val in re.findall(pattern, script.string)}
            if "#gaugeTypeMulti" in script.string:
                att_data = {code: int(val) for code, val in re.findall(pattern, script.string)}

    # --- B. PARSE EXAM HISTORY ---
    soup_exam = BeautifulSoup(scraped_data['exams'], "html.parser")
    semester_history = []
    
    # Extract CGPA from the summary card
    cgpa_p = soup_exam.find("p", string=re.compile(r"\d+\.\d+"))
    final_cgpa = cgpa_p.get_text(strip=True) if cgpa_p else "N/A"

    # Find all result tables
    tables = soup_exam.find_all("table", class_="res-table")
    for table in tables:
        caption = table.find("caption").get_text(" ", strip=True)
        sem_name = caption.split("Credits")[0].strip()
        
        # Extract SGPA using regex from the caption string
        sgpa_match = re.search(r"SGPA:\s*(\d+\.\d+)", caption)
        earned_match = re.search(r"Credits Earned\s*:\s*(\d+)", caption)
        
        sem_data = {
            "semester": sem_name,
            "sgpa": sgpa_match.group(1) if sgpa_match else "N/A",
            "credits_earned": earned_match.group(1) if earned_match else "N/A",
            "courses": []
        }

        # Course details in rows
        for row in table.find("tbody").find_all("tr"):
            cols = row.find_all("td")
            if len(cols) >= 6:
                sem_data["courses"].append({
                    "code": cols[0].get_text(strip=True),
                    "name": cols[1].get_text(strip=True),
                    "gpa": cols[4].get_text(strip=True),
                    "grade": cols[5].get_text(strip=True)
                })
        semester_history.append(sem_data)

    # --- C. UPDATE JSON DATABASE ---
    student_record = {
        "name": name,
        "usn": usn,
        "class_details": class_info,
        "cgpa": final_cgpa,
        "last_updated": time.strftime("%Y-%m-%d %H:%M:%S"),
        "current_semester": [
            {
                "code": code,
                "name": s_name,
                "cie": cie_data.get(code, 0),
                "attendance": att_data.get(code, 0)
            } for code, s_name in subject_map.items()
        ],
        "exam_history": semester_history
    }

    database = {}
    if os.path.exists(JSON_STORAGE):
        with open(JSON_STORAGE, "r") as f:
            try: database = json.load(f)
            except: pass

    database[usn] = student_record

    with open(JSON_STORAGE, "w") as f:
        json.dump(database, f, indent=4)
    
    print(f"[+] All data (Dashboard + Exams) saved for {name} ({usn})")

#---Part done by Ajay----
# --- EXECUTION ---
if __name__ == "__main__":
    MY_USN = "1MS24IS400"
    DD, MM, YYYY = "20", "10", "2005"

    full_data = get_complete_student_data(MY_USN, DD, MM, YYYY)
    if full_data:
        parse_and_save_data(full_data)