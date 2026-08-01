import sqlite3
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "eduportal.db"


def init_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.executescript(
        """
        CREATE TABLE IF NOT EXISTS applicant_profile (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            age INTEGER,
            present_school TEXT,
            teaching_experience TEXT,
            qualification TEXT,
            college_university TEXT,
            other_qualification TEXT,
            school_of_choice TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS principal_duties (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            duty TEXT NOT NULL UNIQUE
        );

        CREATE TABLE IF NOT EXISTS deputy_headteacher_roles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            role TEXT NOT NULL UNIQUE
        );
        """
    )

    cursor.execute("DELETE FROM applicant_profile")
    cursor.execute("DELETE FROM principal_duties")
    cursor.execute("DELETE FROM deputy_headteacher_roles")

    cursor.execute(
        """
        INSERT INTO applicant_profile (
            name, age, present_school, teaching_experience, qualification,
            college_university, other_qualification, school_of_choice
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            "",
            None,
            "",
            "",
            "",
            "",
            "",
            "",
        ),
    )

    principal_duties = [
        "Supervise the school's curriculum in relation to teaching and learning.",
        "Foster a favorable working relationship with the Deputy Principal and staff.",
        "Ensure teachers carry out their duties effectively and efficiently and provide necessary support.",
        "Regulate school admissions and keep the admission register/book up to date.",
        "Plan, implement and monitor school building projects.",
        "Supervise the welfare of teachers and pupils.",
        "Ensure and maintain good discipline of staff and pupils.",
        "Safeguard the safety and security of staff, parents, pupils and school property.",
        "Keep a logbook for major events, visitations and absences.",
        "Keep a stock book and regular inventory.",
        "Maintain relations with the community, Ministry of Education and Training, donor agencies, examination council, and other school partners.",
        "Prepare annual progress reports, financial reports, and statistical returns.",
        "Ensure inspection recommendations are implemented.",
        "Convene and chair school meetings.",
        "Perform secretary duties to the School Committee.",
        "Receive, bank and disburse school funds and maintain records.",
        "Prepare the school's annual budget with stakeholders and present to parents.",
    ]

    deputy_roles = [
        "Deputize for the Headteacher.",
        "Act as principal in waiting.",
        "Serve as a shock absorber for the Principal.",
        "Advise the Headteacher on major decisions.",
        "Brief the Principal before discussions.",
        "Prepare the school timetable.",
        "Supervise attendance, punctuality and conduct.",
        "Supervise administration including grounds, classrooms, duty roster, assemblies, routines, stock, attendance and regulations.",
        "Handle discipline cases teachers cannot resolve.",
        "Punish minor offences and record them.",
        "Supervise students' welfare.",
        "Assist in admissions when requested.",
        "Help new teachers settle in.",
        "Attend parents' meetings.",
        "Liaise with Heads of Departments.",
        "Meet with prefects.",
        "Help maintain discipline including absence without leave and staff misconduct.",
    ]

    cursor.executemany(
        "INSERT INTO principal_duties (duty) VALUES (?)",
        [(duty,) for duty in principal_duties],
    )
    cursor.executemany(
        "INSERT INTO deputy_headteacher_roles (role) VALUES (?)",
        [(role,) for role in deputy_roles],
    )

    conn.commit()
    conn.close()


if __name__ == "__main__":
    init_db()
    print(f"Database created successfully at {DB_PATH}")
