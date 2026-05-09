import sys
import os
import psycopg2

sys.path.append(os.getcwd())
from config.settings import settings

def list_students():
    try:
        conn = psycopg2.connect(settings.DATABASE_URL)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT s.usn, s.name, s.current_year, p.proctor_id
            FROM students s
            JOIN proctor_student_map p ON s.usn = p.student_id
            LIMIT 10
        """)
        rows = cursor.fetchall()
        print("Total fetched:", len(rows))
        for row in rows:
            print(f"USN: {row[0]}, Name: {row[1]}, Year: {row[2]}, Proctor: {row[3]}")
        cursor.close()
        conn.close()
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    list_students()
