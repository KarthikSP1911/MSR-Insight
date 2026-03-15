import json
import re
import os
import random
import time
import requests
import warnings
import urllib3
import concurrent.futures

# Suppress InsecureRequestWarning for unverified HTTPS requests
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select
from bs4 import BeautifulSoup

# --- CONFIGURATION ---
BRAVE_PATH = "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"
# BRAVE_PATH = r"C:\Users\karth\AppData\Local\BraveSoftware\Brave-Browser\Application\brave.exe"

# Resolve path relative to this script so it always drops in the fastapi root directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JSON_STORAGE = os.path.join(BASE_DIR, "all_students_report.json")

def get_complete_student_data(usn, day, month, year):
    options = Options()
    options.binary_location = BRAVE_PATH
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--headless") # Uncomment to hide browser
    # Optimize page load speed
    options.add_argument("--disable-gpu")
    options.add_argument("--blink-settings=imagesEnabled=false")
    options.page_load_strategy = 'eager'

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
        time.sleep(2) 

        if "dashboard" not in driver.current_url.lower() and "Logout" not in driver.page_source:
            print("[!] Login failed.")
            return None

        # 2. Capture Dashboard (Attendance/CIE)
        print("[+] Scraped Dashboard.")
        dashboard_html = driver.page_source
        scraped_data = {"dashboard": dashboard_html, "attendance": {}, "cie": {}}
        
        # Migrate session cookies to requests to perform fast concurrent fetches
        print("[*] Transitioning to lightning fast concurrent requests...")
        session = requests.Session()
        session.verify = False  # Ignore SSL certificate verification errors
        session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        })
        for cookie in driver.get_cookies():
            session.cookies.set(cookie['name'], cookie['value'])
            
        driver.quit() # Close browser early, no longer needed
        
        # Scrape attendance and CIE for each subject present in the dashboard
        soup_dash = BeautifulSoup(dashboard_html, "html.parser")
        course_table = soup_dash.find("table", class_=re.compile(r"dash_od_row"))
        
        fetch_tasks = []

        if course_table:
            tbody = course_table.find("tbody")
            if tbody:
                for row in tbody.find_all("tr"):
                    cols = row.find_all("td")
                    if len(cols) >= 6:
                        course_code = cols[0].get_text(strip=True)
                        
                        # 4th index is attendance, 5th is CIE
                        att_link_element = cols[4].find("a", href=re.compile(r"task=attendencelist"))
                        if att_link_element and "href" in att_link_element.attrs:
                            att_url = att_link_element["href"]
                            full_att_url = f"https://parents.msrit.edu/newparents/{att_url}"
                            fetch_tasks.append((full_att_url, course_code, "attendance"))
                                
                        cie_link_element = cols[5].find("a", href=re.compile(r"task=ciedetails"))
                        if cie_link_element and "href" in cie_link_element.attrs:
                            cie_url = cie_link_element["href"]
                            full_cie_url = f"https://parents.msrit.edu/newparents/{cie_url}"
                            fetch_tasks.append((full_cie_url, course_code, "cie"))

        # 3. Add Exam History (CGPA/SGPA)
        exam_url = "https://parents.msrit.edu/newparents/index.php?option=com_history&task=getResult"
        fetch_tasks.append((exam_url, "EXAMS", "exams"))
        
        def fetch_url(url, c_code, req_type):
            try:
                # Add a small random delay to avoid triggering rate limits / IP blocks
                time.sleep(random.uniform(0.1, 0.5))
                resp = session.get(url, timeout=10)
                return c_code, req_type, resp.text
            except Exception as e:
                print(f"    [!] Failed to fetch {req_type} for {c_code}: {e}")
                return c_code, req_type, ""

        print(f"[*] Fetching {len(fetch_tasks)} pages concurrently (Exams, Attendance, CIE)...")
        # Throttle concurrent requests down to a safer limit (e.g. 5 workers)
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            future_to_url = {executor.submit(fetch_url, task[0], task[1], task[2]): task for task in fetch_tasks}
            for future in concurrent.futures.as_completed(future_to_url):
                course_code, data_type, html = future.result()
                if data_type == "exams":
                    scraped_data["exams"] = html
                    print(f"    -> Fetched Exam History")
                elif data_type == "attendance":
                    scraped_data["attendance"][course_code] = html
                    print(f"    -> Fetched Attendance for {course_code}")
                elif data_type == "cie":
                    scraped_data["cie"][course_code] = html
                    print(f"    -> Fetched CIE for {course_code}")

        return scraped_data

    except Exception as e:
        print(f"[X] Automation Error: {e}")
        return None
    finally:
        try:
            driver.quit()
        except:
            pass

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

    def parse_attendance_html(course_code):
        details = {
            "present_classes": 0,
            "absent_classes": 0,
            "still_to_go": 0,
            "classes": {
                "present_dates": [],
                "absent_dates": []
            }
        }
        
        html_content = scraped_data.get("attendance", {}).get(course_code)
        if html_content:
            soup = BeautifulSoup(html_content, "html.parser")
            
            # Parse Present/Absent/Still to go count
            present_span = soup.find("span", class_=re.compile(r"cn-attend"))
            if present_span:
                m = re.search(r'\[(\d+)\]', present_span.get_text())
                if m: details["present_classes"] = int(m.group(1))
            
            absent_span = soup.find("span", class_=re.compile(r"cn-absent"))
            if absent_span:
                m = re.search(r'\[(\d+)\]', absent_span.get_text())
                if m: details["absent_classes"] = int(m.group(1))

            still_span = soup.find("span", class_=re.compile(r"cn-still"))
            if still_span:
                m = re.search(r'\[(\d+)\]', still_span.get_text())
                if m: details["still_to_go"] = int(m.group(1))
            
            # Parse Present table
            present_table = soup.find("table", class_=re.compile(r"cn-attend-list1"))
            if present_table:
                tbody = present_table.find("tbody")
                if tbody:
                    for row in tbody.find_all("tr"):
                        cols = row.find_all("td")
                        if len(cols) >= 4:
                            details["classes"]["present_dates"].append(cols[1].get_text(strip=True))

            # Parse Absent table
            absent_table = soup.find("table", class_=re.compile(r"cn-attend-list2"))
            if absent_table:
                tbody = absent_table.find("tbody")
                if tbody:
                    for row in tbody.find_all("tr"):
                        cols = row.find_all("td")
                        if len(cols) >= 4:
                            details["classes"]["absent_dates"].append(cols[1].get_text(strip=True))

        return details

    def parse_cie_html(course_code):
        tests = []
        html_content = scraped_data.get("cie", {}).get(course_code)
        eligibility = "Unknown"
        
        if html_content:
            soup = BeautifulSoup(html_content, "html.parser")
            
            # Find the eligibility in the table with class cn-cie-table
            cie_table = soup.find("table", class_=re.compile(r"cn-cie-table"))
            if cie_table:
                # Find the column index for Eligibility
                thead = cie_table.find("thead")
                eligibility_index = -1
                if thead:
                    headers = thead.find_all("th")
                    for i, th in enumerate(headers):
                        if "Eligibility" in th.get_text():
                            eligibility_index = i
                            break
                            
                # Get the value from the first row of tbody based on the index
                if eligibility_index != -1:
                    tbody = cie_table.find("tbody")
                    if tbody:
                        first_row = tbody.find("tr")
                        if first_row:
                            cols = first_row.find_all("td")
                            if len(cols) > eligibility_index:
                                eligibility = cols[eligibility_index].get_text(strip=True)
            
            # Extract chartData from the script block
            match = re.search(r'var\s+chartData\s*=\s*(\[.*?\]);', html_content, re.DOTALL)
            if match:
                chart_data_str = match.group(1)
                # The JSON in the HTML is slightly malformed (trailing commas in objects), let's clean it via regex
                clean_json_str = re.sub(r',\s*}', '}', chart_data_str)
                clean_json_str = re.sub(r',\s*]', ']', clean_json_str)

                try:
                    chart_data = json.loads(clean_json_str)
                    for item in chart_data:
                        test_name = item.get("xaxis", "")
                        tests.append({
                            "test_name": test_name,
                            "class_average": item.get("col1", 0),
                            "max_marks": item.get("col2", 0), 
                            "marks_obtained": item.get("linevalue", 0) 
                        })
                except Exception as e:
                    print(f"    [!] Error parsing CIE chartData for {course_code}: {e}")
        return tests, eligibility

    current_semester_data = []
    for code, s_name in subject_map.items():
        att_details = parse_attendance_html(code)
        cie_details, eligibility = parse_cie_html(code)
        
        current_semester_data.append({
            "code": code,
            "name": s_name,
            "eligibility": eligibility,
            "attendance_details": att_details,
            "cie_details": {
                "tests": cie_details
            }
        })

    # --- B. PARSE EXAM HISTORY ---
    soup_exam = BeautifulSoup(scraped_data.get("exams", ""), "html.parser")
    semester_history = []
    
    # Extract CGPA from the summary card
    cgpa_p = soup_exam.find("p", string=re.compile(r"\d+\.\d+"))
    final_cgpa = cgpa_p.get_text(strip=True) if cgpa_p else "N/A"

    # Find all result tables
    tables = soup_exam.find_all("table", class_="res-table")
    for table in tables:
        caption = table.find("caption")
        if not caption:
            continue
            
        caption_text = caption.get_text(" ", strip=True)
        sem_name = caption_text.split("Credits")[0].strip()
        
        # Extract SGPA using regex from the caption string
        sgpa_match = re.search(r"SGPA:\s*(\d+\.\d+)", caption_text)
        earned_match = re.search(r"Credits Earned\s*:\s*(\d+)", caption_text)
        
        sem_data = {
            "semester": sem_name,
            "sgpa": sgpa_match.group(1) if sgpa_match else "N/A",
            "credits_earned": earned_match.group(1) if earned_match else "N/A",
            "courses": []
        }

        # Course details in rows
        tbody = table.find("tbody")
        if tbody:
            for row in tbody.find_all("tr"):
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
        "current_semester": current_semester_data,
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

    # Trigger normalization for downstream services (AI, etc.)
    try:
        try:
            from .data_normalizer import DataNormalizer
        except (ImportError, ValueError):
            from data_normalizer import DataNormalizer
        
        normalized_path = os.path.join(BASE_DIR, "normalized_data.json")
        DataNormalizer.normalize_all_data(JSON_STORAGE, normalized_path)
        print(f"[+] Data normalization complete. Saved to {normalized_path}")
    except Exception as e:
        print(f"[!] Normalization failed: {e}")

#---Part done by Ajay----
# --- EXECUTION ---
if __name__ == "__main__":
    MY_USN = "1MS23IS051"
    DD, MM, YYYY = "19", "11", "2004"

    full_data = get_complete_student_data(MY_USN, DD, MM, YYYY)
    if full_data:
        parse_and_save_data(full_data)