import json
import re
import os
import random
import time
import requests
import warnings
import urllib3
import concurrent.futures
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select
from bs4 import BeautifulSoup
from config.settings import settings

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

BRAVE_PATH = r"C:\Users\karth\AppData\Local\BraveSoftware\Brave-Browser\Application\brave.exe"

def get_complete_student_data(usn, day, month, year):
    options = Options()
    options.binary_location = BRAVE_PATH
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--headless")
    options.add_argument("--disable-gpu")
    options.add_argument("--blink-settings=imagesEnabled=false")
    options.page_load_strategy = 'eager'

    driver = webdriver.Chrome(options=options)
    
    try:
        print(f"[*] Accessing portal for USN: {usn}...")
        driver.get("https://parents.msrit.edu/newparents/")
        
        driver.find_element(By.ID, "username").send_keys(usn)
        Select(driver.find_element(By.ID, "dd")).select_by_value(f"{day} ") 
        Select(driver.find_element(By.ID, "mm")).select_by_value(month)
        Select(driver.find_element(By.ID, "yyyy")).select_by_value(year)
        
        login_btn = driver.find_element(By.CLASS_NAME, "cn-login-btn")
        driver.execute_script("arguments[0].click();", login_btn)
        time.sleep(2) 

        if "dashboard" not in driver.current_url.lower() and "Logout" not in driver.page_source:
            return None

        dashboard_html = driver.page_source
        scraped_data = {"dashboard": dashboard_html, "attendance": {}, "cie": {}}
        
        session = requests.Session()
        session.verify = False 
        session.headers.update({"User-Agent": "Mozilla/5.0"})
        for cookie in driver.get_cookies():
            session.cookies.set(cookie['name'], cookie['value'])
            
        driver.quit()
        
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
                        att_link = cols[4].find("a", href=re.compile(r"task=attendencelist"))
                        if att_link: fetch_tasks.append((f"https://parents.msrit.edu/newparents/{att_link['href']}", course_code, "attendance"))
                        cie_link = cols[5].find("a", href=re.compile(r"task=ciedetails"))
                        if cie_link: fetch_tasks.append((f"https://parents.msrit.edu/newparents/{cie_link['href']}", course_code, "cie"))

        fetch_tasks.append(("https://parents.msrit.edu/newparents/index.php?option=com_history&task=getResult", "EXAMS", "exams"))
        
        def fetch_url(url, c_code, req_type):
            try:
                time.sleep(random.uniform(0.1, 0.5))
                resp = session.get(url, timeout=10)
                return c_code, req_type, resp.text
            except:
                return c_code, req_type, ""

        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(fetch_url, t[0], t[1], t[2]) for t in fetch_tasks]
            for future in concurrent.futures.as_completed(futures):
                c_code, d_type, html = future.result()
                if d_type == "exams": scraped_data["exams"] = html
                elif d_type == "attendance": scraped_data["attendance"][c_code] = html
                elif d_type == "cie": scraped_data["cie"][c_code] = html

        return scraped_data
    except Exception as e:
        print(f"[X] Automation Error: {e}")
        return None
    finally:
        try: driver.quit()
        except: pass

def parse_and_save_data(scraped_data):
    soup_dash = BeautifulSoup(scraped_data['dashboard'], "html.parser")
    name = soup_dash.find("h3").get_text(strip=True) if soup_dash.find("h3") else "Unknown"
    usn = soup_dash.find("h2").get_text(strip=True) if soup_dash.find("h2") else "Unknown"
    class_info = soup_dash.find("p").get_text(strip=True) if soup_dash.find("p") else ""

    subject_map = {}
    for row in soup_dash.find_all("tr"):
        cols = row.find_all("td")
        if len(cols) >= 2:
            code = cols[0].get_text(strip=True)
            if re.match(r"^[0-9A-Z]{5,10}$", code):
                subject_map[code] = cols[1].get_text(strip=True)

    def parse_attendance_html(code):
        details = {"present_classes": 0, "absent_classes": 0, "still_to_go": 0, "classes": {"present_dates": [], "absent_dates": []}}
        html = scraped_data.get("attendance", {}).get(code)
        if html:
            soup = BeautifulSoup(html, "html.parser")
            for key, cls in [("present_classes", "cn-attend"), ("absent_classes", "cn-absent"), ("still_to_go", "cn-still")]:
                span = soup.find("span", class_=re.compile(cls))
                if span:
                    m = re.search(r'\[(\d+)\]', span.get_text())
                    if m: details[key] = int(m.group(1))
            
            p_table = soup.find("table", class_=re.compile(r"cn-attend-list1"))
            if p_table and p_table.find("tbody"):
                details["classes"]["present_dates"] = [r.find_all("td")[1].get_text(strip=True) for r in p_table.find("tbody").find_all("tr") if len(r.find_all("td")) >= 2]
            
            a_table = soup.find("table", class_=re.compile(r"cn-attend-list2"))
            if a_table and a_table.find("tbody"):
                details["classes"]["absent_dates"] = [r.find_all("td")[1].get_text(strip=True) for r in a_table.find("tbody").find_all("tr") if len(r.find_all("td")) >= 2]
        return details

    def parse_cie_html(code):
        tests, eligibility = [], "Unknown"
        html = scraped_data.get("cie", {}).get(code)
        if html:
            soup = BeautifulSoup(html, "html.parser")
            cie_table = soup.find("table", class_=re.compile(r"cn-cie-table"))
            if cie_table:
                headers = [th.get_text().strip() for th in cie_table.find("thead").find_all("th")] if cie_table.find("thead") else []
                if "Eligibility" in headers:
                    idx = headers.index("Eligibility")
                    row = cie_table.find("tbody").find("tr") if cie_table.find("tbody") else None
                    if row and len(row.find_all("td")) > idx: eligibility = row.find_all("td")[idx].get_text(strip=True)
            
            match = re.search(r'var\s+chartData\s*=\s*(\[.*?\]);', html, re.DOTALL)
            if match:
                try:
                    data = json.loads(re.sub(r',\s*([}\]])', r'\1', match.group(1)))
                    tests = [{"test_name": i.get("xaxis", ""), "class_average": i.get("col1", 0), "max_marks": i.get("col2", 0), "marks_obtained": i.get("linevalue", 0)} for i in data]
                except: pass
        return tests, eligibility

    current_semester_data = []
    for code, s_name in subject_map.items():
        att = parse_attendance_html(code)
        cie, elig = parse_cie_html(code)
        current_semester_data.append({"code": code, "name": s_name, "eligibility": elig, "attendance_details": att, "cie_details": {"tests": cie}})

    soup_exam = BeautifulSoup(scraped_data.get("exams", ""), "html.parser")
    cgpa_p = soup_exam.find("p", string=re.compile(r"\d+\.\d+"))
    final_cgpa = cgpa_p.get_text(strip=True) if cgpa_p else "N/A"

    semester_history = []
    for table in soup_exam.find_all("table", class_="res-table"):
        cap = table.find("caption").get_text(" ", strip=True) if table.find("caption") else ""
        sem_data = {
            "semester": cap.split("Credits")[0].strip(),
            "sgpa": (re.search(r"SGPA:\s*(\d+\.\d+)", cap).group(1) if re.search(r"SGPA:\s*(\d+\.\d+)", cap) else "N/A"),
            "credits_earned": (re.search(r"Credits Earned\s*:\s*(\d+)", cap).group(1) if re.search(r"Credits Earned\s*:\s*(\d+)", cap) else "N/A"),
            "courses": [{"code": r.find_all("td")[0].get_text(strip=True), "name": r.find_all("td")[1].get_text(strip=True), "gpa": r.find_all("td")[4].get_text(strip=True), "grade": r.find_all("td")[5].get_text(strip=True)} for r in table.find("tbody").find_all("tr") if len(r.find_all("td")) >= 6]
        }
        semester_history.append(sem_data)

    student_record = {"name": name, "usn": usn, "class_details": class_info, "cgpa": final_cgpa, "last_updated": time.strftime("%Y-%m-%d %H:%M:%S"), "current_semester": current_semester_data, "exam_history": semester_history}

    database = {}
    if os.path.exists(settings.SCRAPED_DATA_PATH):
        with open(settings.SCRAPED_DATA_PATH, "r") as f:
            try: database = json.load(f)
            except: pass

    database[usn] = student_record
    os.makedirs(os.path.dirname(settings.SCRAPED_DATA_PATH), exist_ok=True)
    with open(settings.SCRAPED_DATA_PATH, "w") as f:
        json.dump(database, f, indent=4)
    
    print(f"[+] Data saved for {name} ({usn})")

    try:
        from services.normalization_service import DataNormalizer
        from services.sync_service import SyncService
        DataNormalizer.normalize_all_data(settings.SCRAPED_DATA_PATH, settings.NORMALIZED_DATA_PATH)
        SyncService.sync_to_express(settings.NORMALIZED_DATA_PATH)
    except Exception as e:
        print(f"[!] Downstream tasks failed: {e}")

if __name__ == "__main__":
    MY_USN = "1MS23IS051"
    DD, MM, YYYY = "19", "11", "2004"
    data = get_complete_student_data(MY_USN, DD, MM, YYYY)
    if data: parse_and_save_data(data)
