import sqlite3
import os
import difflib
import re
from typing import List, Dict, Any, Optional, Tuple

DB_FILE = os.path.join(os.path.dirname(__file__), "leads.db")

def get_db_connection(custom_db_path: str = None):
    target_db = custom_db_path if custom_db_path else DB_FILE
    conn = sqlite3.connect(target_db)
    conn.row_factory = sqlite3.Row
    return conn

def init_db(force_recreate=False):
    """Initializes the database and creates/recreates the leads and projects tables."""
    os.makedirs(os.path.dirname(DB_FILE), exist_ok=True)
    
    if force_recreate and os.path.exists(DB_FILE):
        try:
            os.remove(DB_FILE)
        except Exception as e:
            print(f"Warning: Could not remove old DB file: {e}")

    with get_db_connection() as conn:
        # 1. Projects Table
        conn.execute("""
        CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            slug TEXT UNIQUE NOT NULL,
            description TEXT,
            category TEXT DEFAULT 'Enterprise B2B',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            db_filename TEXT
        );
        """)

        # 2. Leads Table
        conn.execute("""
        CREATE TABLE IF NOT EXISTS leads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            confidence_score REAL,
            extracted_status TEXT DEFAULT 'Pending',
            project_slug TEXT DEFAULT 'default',
            
            -- Core CRM Schema
            email TEXT,
            customerCode TEXT,
            firstName TEXT,
            lastName TEXT,
            birthDate TEXT,
            secondaryEmail TEXT,
            phone TEXT,
            secondaryPhone TEXT,
            status TEXT,
            timezone TEXT,
            jobTitle TEXT,
            companyCode TEXT,
            companyName TEXT,
            street TEXT,
            city TEXT,
            state TEXT,
            country TEXT,
            zipCode TEXT,
            linkedin TEXT,
            facebook TEXT,
            twitter TEXT,
            instagram TEXT,
            preferredContactMethod TEXT,
            tags TEXT,
            notes TEXT,
            customerTypeInternal TEXT,
            customerType TEXT,
            engagementType TEXT,
            engagementDate TEXT,
            renewal_date TEXT,
            
            -- Extended Intelligence & Classification
            industry TEXT,
            ssic_code TEXT,
            paid_up_capital TEXT,
            incorporation_date TEXT,
            target_audience TEXT,
            email_source TEXT,
            phone_source TEXT,
            front_image_path TEXT
        );
        """)

        # Add project_slug column to leads if missing (for backwards compatibility)
        try:
            cursor = conn.execute("PRAGMA table_info(leads)")
            existing_cols = [row["name"] for row in cursor.fetchall()]
            if "project_slug" not in existing_cols:
                conn.execute("ALTER TABLE leads ADD COLUMN project_slug TEXT DEFAULT 'default'")
            if "industry" not in existing_cols:
                conn.execute("ALTER TABLE leads ADD COLUMN industry TEXT")
            if "ssic_code" not in existing_cols:
                conn.execute("ALTER TABLE leads ADD COLUMN ssic_code TEXT")
            if "paid_up_capital" not in existing_cols:
                conn.execute("ALTER TABLE leads ADD COLUMN paid_up_capital TEXT")
            if "incorporation_date" not in existing_cols:
                conn.execute("ALTER TABLE leads ADD COLUMN incorporation_date TEXT")
            if "target_audience" not in existing_cols:
                conn.execute("ALTER TABLE leads ADD COLUMN target_audience TEXT DEFAULT 'Enterprise B2B'")
            if "email_source" not in existing_cols:
                conn.execute("ALTER TABLE leads ADD COLUMN email_source TEXT")
            if "phone_source" not in existing_cols:
                conn.execute("ALTER TABLE leads ADD COLUMN phone_source TEXT")
            if "front_image_path" not in existing_cols:
                conn.execute("ALTER TABLE leads ADD COLUMN front_image_path TEXT")
        except Exception as e:
            print(f"Schema migration note: {e}")

        # Seed default projects if none exist
        cursor = conn.execute("SELECT COUNT(*) FROM projects")
        if cursor.fetchone()[0] == 0:
            default_projects = [
                ("Master Database", "default", "Primary enterprise CRM lead repository", "All Industries"),
                ("Education & ITE Sector", "education_ite", "Vocational education, ITE institutions, and EdTech startups", "Education & Training"),
                ("AI & Software Startups", "ai_software", "DeepTech, Generative AI, and Cloud SaaS enterprise solutions", "Technology & AI"),
                ("FinTech & Trade Commerce", "fintech_trade", "Quantitative trading, wealth management, and wholesale trade", "FinTech & Trade")
            ]
            for name, slug, desc, cat in default_projects:
                conn.execute("INSERT OR IGNORE INTO projects (name, slug, description, category) VALUES (?, ?, ?, ?)", (name, slug, desc, cat))

        conn.commit()

def get_all_projects() -> List[Dict[str, Any]]:
    """Retrieves all registered project workspaces with lead counts."""
    init_db()
    with get_db_connection() as conn:
        projects = [dict(r) for r in conn.execute("SELECT * FROM projects ORDER BY id ASC").fetchall()]
        for p in projects:
            slug = p["slug"]
            if slug == "default":
                cnt = conn.execute("SELECT COUNT(*) FROM leads WHERE project_slug = 'default' OR project_slug IS NULL").fetchone()[0]
            else:
                cnt = conn.execute("SELECT COUNT(*) FROM leads WHERE project_slug = ?", (slug,)).fetchone()[0]
            p["lead_count"] = cnt
        return projects

def create_project(name: str, description: str = "", category: str = "Enterprise B2B") -> Dict[str, Any]:
    """Creates a new project database space."""
    init_db()
    name = (name or "").strip()
    if not name:
        raise ValueError("Project name cannot be empty.")
        
    base_slug = re.sub(r'[^a-z0-9]+', '_', name.lower()).strip('_')
    if not base_slug:
        base_slug = f"project_{os.urandom(3).hex()}"

    slug = base_slug
    counter = 1
    with get_db_connection() as conn:
        cursor = conn.cursor()
        while cursor.execute("SELECT id FROM projects WHERE slug = ? OR name = ?", (slug, name)).fetchone():
            name = f"{name} ({counter})"
            slug = f"{base_slug}_{counter}"
            counter += 1

        cursor.execute(
            "INSERT INTO projects (name, slug, description, category) VALUES (?, ?, ?, ?)",
            (name, slug, description, category)
        )
        project_id = cursor.lastrowid
        conn.commit()
        return {"id": project_id, "name": name, "slug": slug, "description": description, "category": category}

def get_leads_by_project(project_slug: str = None) -> List[Dict[str, Any]]:
    """Retrieves all leads belonging to a specific project (or all if slug is 'default' or None)."""
    init_db()
    with get_db_connection() as conn:
        if not project_slug or project_slug in ["default", "all", "Master Database"]:
            rows = conn.execute("SELECT * FROM leads ORDER BY id DESC").fetchall()
        else:
            rows = conn.execute("SELECT * FROM leads WHERE project_slug = ? ORDER BY id DESC", (project_slug,)).fetchall()
        return [dict(r) for r in rows]

def get_all_leads() -> List[Dict[str, Any]]:
    """Retrieves all leads across all projects."""
    return get_leads_by_project("default")

def insert_lead(lead_data: Dict[str, Any], project_slug: str = "default") -> int:
    """Inserts a new lead into the designated project database."""
    init_db()
    slug = project_slug or lead_data.get("project_slug") or "default"
    lead_data["project_slug"] = slug

    columns = [
        "confidence_score", "extracted_status", "project_slug", "email", "customerCode", 
        "firstName", "lastName", "birthDate", "secondaryEmail", "phone", 
        "secondaryPhone", "status", "timezone", "jobTitle", "companyCode", 
        "companyName", "street", "city", "state", "country", "zipCode", 
        "linkedin", "facebook", "twitter", "instagram", "preferredContactMethod", 
        "tags", "notes", "customerTypeInternal", "customerType", "engagementType", 
        "engagementDate", "renewal_date", "industry", "ssic_code", "paid_up_capital", 
        "incorporation_date", "target_audience", "email_source", "phone_source", "front_image_path"
    ]
    
    placeholders = ", ".join(["?"] * len(columns))
    col_str = ", ".join(columns)
    query = f"INSERT INTO leads ({col_str}) VALUES ({placeholders})"
    values = [lead_data.get(col) for col in columns]
    
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(query, values)
        conn.commit()
        return cursor.lastrowid

def check_duplicate_lead(email: str, first_name: str, last_name: str, company: str, project_slug: str = None) -> Optional[int]:
    """
    Checks if a lead already exists in the project.
    Matching logic: Exact email match or >=80% fuzzy match on Name + Company.
    """
    leads = get_leads_by_project(project_slug)
    
    if email and email.strip():
        for lead in leads:
            if lead.get("email") and lead["email"].strip().lower() == email.strip().lower():
                return lead["id"]
                
    def safe_str(val): return str(val).strip().lower() if val else ""
    target_name = safe_str(first_name) + " " + safe_str(last_name)
    target_company = safe_str(company)
    
    if len(target_name.strip()) < 3 and len(target_company.strip()) < 3:
        return None
        
    for lead in leads:
        lead_name = safe_str(lead.get("firstName")) + " " + safe_str(lead.get("lastName"))
        lead_company = safe_str(lead.get("companyName"))
        
        name_sim = difflib.SequenceMatcher(None, target_name, lead_name).ratio()
        comp_sim = difflib.SequenceMatcher(None, target_company, lead_company).ratio()
        
        if name_sim >= 0.8 and comp_sim >= 0.8:
            return lead["id"]
            
    return None

def update_lead(lead_id: int, lead_data: Dict[str, Any]) -> bool:
    """Updates an existing lead's details."""
    init_db()
    columns = [
        "confidence_score", "extracted_status", "project_slug", "email", "customerCode", 
        "firstName", "lastName", "birthDate", "secondaryEmail", "phone", 
        "secondaryPhone", "status", "timezone", "jobTitle", "companyCode", 
        "companyName", "street", "city", "state", "country", "zipCode", 
        "linkedin", "facebook", "twitter", "instagram", "preferredContactMethod", 
        "tags", "notes", "customerTypeInternal", "customerType", "engagementType", 
        "engagementDate", "renewal_date", "industry", "ssic_code", "paid_up_capital", 
        "incorporation_date", "target_audience", "email_source", "phone_source", "front_image_path"
    ]
    
    # Only update columns present in lead_data or provide fallback
    set_clauses = []
    values = []
    for col in columns:
        if col in lead_data:
            set_clauses.append(f"{col} = ?")
            values.append(lead_data[col])
            
    if not set_clauses:
        return False
        
    query = f"UPDATE leads SET {', '.join(set_clauses)} WHERE id = ?"
    values.append(lead_id)
    
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(query, values)
        conn.commit()
        return cursor.rowcount > 0

def delete_lead(lead_id: int) -> bool:
    """Deletes a lead record by ID."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM leads WHERE id = ?", (lead_id,))
        conn.commit()
        return cursor.rowcount > 0

def filter_leads_sql(
    project_slug: str = "default",
    industry_keyword: str = None,
    target_audience: str = None,
    entity_status: str = None,
    min_confidence: float = None,
    search_q: str = None
) -> List[Dict[str, Any]]:
    """
    Executes dynamic SQL filtering across leads based on SSIC industry, target audience, entity status, and search query.
    """
    init_db()
    conditions = []
    params = []

    if project_slug and project_slug not in ["default", "all", "Master Database"]:
        conditions.append("project_slug = ?")
        params.append(project_slug)

    if industry_keyword and industry_keyword.strip() and industry_keyword != "all":
        conditions.append("(LOWER(industry) LIKE ? OR LOWER(tags) LIKE ? OR LOWER(companyName) LIKE ?)")
        kw = f"%{industry_keyword.strip().lower()}%"
        params.extend([kw, kw, kw])

    if target_audience and target_audience.strip() and target_audience != "all":
        conditions.append("(LOWER(target_audience) LIKE ? OR LOWER(customerType) LIKE ?)")
        aud = f"%{target_audience.strip().lower()}%"
        params.extend([aud, aud])

    if entity_status and entity_status.strip() and entity_status != "all":
        conditions.append("(LOWER(status) LIKE ? OR LOWER(extracted_status) LIKE ?)")
        st = f"%{entity_status.strip().lower()}%"
        params.extend([st, st])

    if min_confidence is not None:
        conditions.append("confidence_score >= ?")
        params.append(float(min_confidence))

    if search_q and search_q.strip():
        q_wild = f"%{search_q.strip().lower()}%"
        conditions.append("""(
            LOWER(firstName) LIKE ? OR 
            LOWER(lastName) LIKE ? OR 
            LOWER(companyName) LIKE ? OR 
            LOWER(companyCode) LIKE ? OR 
            LOWER(email) LIKE ? OR 
            LOWER(jobTitle) LIKE ?
        )""")
        params.extend([q_wild, q_wild, q_wild, q_wild, q_wild, q_wild])

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
    query = f"SELECT * FROM leads {where_clause} ORDER BY id DESC"

    with get_db_connection() as conn:
        rows = conn.execute(query, params).fetchall()
        return [dict(r) for r in rows]

def create_project_from_filtered_leads(
    new_project_name: str, 
    description: str, 
    category: str, 
    lead_ids: List[int],
    source_project_slug: str = "default"
) -> Dict[str, Any]:
    """
    Creates a new project and clones the specified filtered lead records into it using SQL.
    """
    init_db()
    project = create_project(new_project_name, description, category)
    new_slug = project["slug"]

    if not lead_ids:
        return {"project": project, "copied_count": 0}

    with get_db_connection() as conn:
        placeholders = ",".join(["?"] * len(lead_ids))
        # Fetch matching source leads
        query_select = f"SELECT * FROM leads WHERE id IN ({placeholders})"
        rows = [dict(r) for r in conn.execute(query_select, lead_ids).fetchall()]

        copied_count = 0
        for lead in rows:
            lead.pop("id", None)
            lead["project_slug"] = new_slug
            lead["notes"] = f"Cloned into {new_project_name}. " + (lead.get("notes") or "")
            insert_lead(lead, new_slug)
            copied_count += 1

        return {"project": project, "copied_count": copied_count}

def get_ledger_stats(project_slug: str = "default") -> Dict[str, Any]:
    """Returns aggregated summary metrics for a project ledger."""
    leads = get_leads_by_project(project_slug)
    total = len(leads)
    if total == 0:
        return {
            "total": 0,
            "synced": 0,
            "pending": 0,
            "high_conf_pct": 0,
            "ai_enriched": 0,
            "ai_enriched_pct": 0,
            "avg_confidence": 0.0
        }
    
    synced = sum(1 for r in leads if r.get("status") in ["SYNCED", "Approved", "Synced"])
    pending = sum(1 for r in leads if r.get("status") in ["Pending", "PENDING"])
    scores = [r.get("confidence_score") for r in leads if r.get("confidence_score") is not None]
    high_conf = sum(1 for s in scores if s >= 0.8)
    
    ai_enriched_count = sum(1 for r in leads if r.get("email_source") == "ai_enriched" or r.get("phone_source") == "ai_enriched")
    avg_conf = (sum(scores) / len(scores)) if scores else 0.0
    high_conf_pct = int((high_conf / total) * 100) if total > 0 else 0
    ai_enriched_pct = int((ai_enriched_count / total) * 100) if total > 0 else 0
    
    return {
        "total": total,
        "synced": synced,
        "pending": pending,
        "high_conf_pct": high_conf_pct,
        "ai_enriched": ai_enriched_count,
        "ai_enriched_pct": ai_enriched_pct,
        "avg_confidence": round(avg_conf, 2)
    }

def get_review_queue(project_slug: str = "default", threshold: float = 0.8) -> List[Dict[str, Any]]:
    """Returns leads with confidence_score below threshold in project."""
    init_db()
    leads = get_leads_by_project(project_slug)
    return [l for l in leads if l.get("confidence_score") is not None and l["confidence_score"] < threshold]
