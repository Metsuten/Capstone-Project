# LeadFlow AI — Intelligent Contact Digitization & Enrichment Platform (v3.0)

[![Python Version](https://img.shields.io/badge/Python-3.10%20%7C%203.11%20%7C%203.12%20%7C%203.13-blue.svg)](https://www.python.org/)
[![Framework](https://img.shields.io/badge/Framework-Flask%203.x-green.svg)](https://palletsprojects.com/p/flask/)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)]()
[![Status](https://img.shields.io/badge/Build-Passing-brightgreen.svg)]()

LeadFlow AI is an enterprise-grade contact intelligence and document processing platform that automates the digitization, government ACRA verification, profile enrichment, deduplication, and CRM ingestion of physical business cards into actionable intelligence.

---

## 📋 Table of Contents
1. [System Prerequisites](#-system-prerequisites)
2. [Project Directory Structure](#-project-directory-structure)
3. [⚡ 1-Click Quick Start (Windows)](#-1-click-quick-start-windows)
4. [⚙️ Environment & API Key Configuration (.env)](#️-environment--api-key-configuration-env)
5. [🎯 Live Feature Verification & Testing Guide](#-live-feature-verification--testing-guide)
6. [Troubleshooting & FAQ](#-troubleshooting--faq)

---

## 💻 System Prerequisites

Before running the project, ensure your computer has:
* **Operating System:** Windows 10 / 11 (or macOS / Linux)
* **Python:** Version `3.10`, `3.11`, `3.12`, or `3.13` (Download from [python.org](https://www.python.org/downloads/))
  * *Note: During Python installation on Windows, ensure the box **"Add Python to PATH"** is checked.*
* **Modern Web Browser:** Chrome, Edge, Brave, or Firefox.

---

## 📁 Project Directory Structure

```text
Capstone-Project/
├── .env.example                     # Comprehensive environment template with setup guide
├── .gitignore                       # Git ignore rules for isolated .venv, .env, and caches
├── requirements.txt                 # Complete Python package dependency manifest
├── run_website.bat                  # 1-Click Windows automated launcher & venv builder
├── app.py                           # Flask web server & REST routing engine (Primary UI)
├── database.py                      # SQLite persistence layer & multi-project workspace manager
├── enrichment.py                    # Multimodal LLM prompt orchestration & data enrichment
├── verify_sources.py                # Singapore ACRA registry & business verification engine
├── crm_sync.py                      # External CRM sync & automated dispatcher
├── test_ai.py                       # Multimodal Gemini vision OCR engine & test datasets
├── leads.db                         # Local SQLite database for live contact storage
├── static/                          # High-performance styles, 3D WebGL engine & particle canvas
├── templates/                       # Jinja2 HTML templates & responsive UI views
└── README.md                        # Complete setup, build, and evaluation guide
```

---

## ⚡ 1-Click Quick Start (Windows)

The included `run_website.bat` file automates everything (Python detection, isolated `.venv` creation, dependency installation, database initialization, and opening your browser).

To run the platform:

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ 1. Double-click 'run_website.bat'                                       │
│    └─ Automatically creates '.env' from template & builds (.venv)       │
│                                                                         │
│ 2. Open '.env' in Notepad & paste your free Google Gemini API Key       │
│    └─ GEMINI_API_KEY=your_key_here (from https://aistudio.google.com/) │
│                                                                         │
│ 3. Double-click 'run_website.bat' again                                 │
│    └─ Launches the server and opens your browser to http://localhost:5000│
└─────────────────────────────────────────────────────────────────────────┘
```

---

## ⚙️ Environment & API Key Configuration (.env)

When `run_website.bat` runs for the first time, it automatically creates your `.env` file from `.env.example`. Open `.env` in any text editor to configure your keys:

### 1. 🤖 Google Gemini API Key (Required for live AI card scanning & OCR)
* **Step 1:** Visit [Google AI Studio](https://aistudio.google.com/) and sign in with any Google account.
* **Step 2:** Click **"Get API key"** at the top-left, then click **"Create API key"**.
* **Step 3:** Copy your key and paste it into `.env`:
  ```ini
  GEMINI_API_KEY=your_actual_gemini_api_key_here
  ```
  *(Powers 100% full-quality vision OCR, Singapore ACRA sector classification, and AI email drafting).*

### 2. ✉️ Gmail SMTP App Password (Optional - For real email dispatch)
* **Step 1:** Open your [Google Account Security Settings](https://myaccount.google.com/security) and ensure **2-Step Verification** is turned **ON**.
* **Step 2:** Go to [Google App Passwords](https://myaccount.google.com/apppasswords), enter an app name (e.g. `LeadFlow`), and click **Create**.
* **Step 3:** Copy the 16-character generated password and paste it into `.env`:
  ```ini
  SMTP_SERVER=smtp.gmail.com
  SMTP_PORT=587
  SMTP_USER=your_email@gmail.com
  SMTP_PASSWORD=your_16_character_app_password
  ```
  *(Note: If left blank, LeadFlow AI runs in **Simulation Mode**, allowing you to draft and preview emails on-screen without sending real emails).*

### 3. 🎯 Hunter.io API Key (Optional - B2B Domain Email Deliverability)
* **Step 1:** Visit [Hunter.io](https://hunter.io/) and create a free account.
* **Step 2:** During onboarding (or in dashboard settings), select **"Integrate via API"**.
* **Step 3:** Go to [Hunter.io API Keys](https://hunter.io/api_keys), copy your key, and paste it into `.env`:
  ```ini
  HUNTER_API_KEY=your_hunter_api_key_here
  ```

### 4. 🔍 SerpAPI Key (Optional - Google Search Cross-Checking)
* **Step 1:** Visit [SerpAPI](https://serpapi.com/) and register for a free account.
* **Step 2:** Verify your email, go to [SerpAPI Manage API Key](https://serpapi.com/manage-api-key), and copy your private key.
* **Step 3:** Paste it into `.env`:
  ```ini
  SERPAPI_API_KEY=your_serpapi_key_here
  ```

---

## 🎯 Live Feature Verification & Testing Guide

### 🔑 Test User Accounts
On the login screen (`/login`), you can click any of the 1-click test profiles or log in with:
* **Account 1:** `alex.mercer@nexustech.io` (Enterprise Admin)
* **Account 2:** `elena.rostova@innovmethods.com` (Operations Lead)
* **Account 3:** `damon.vance@vancecap.com` (Venture Partner)
* **Guest Sandbox:** Click *"Continue as Guest"* (Privacy Sandbox mode).

---

### 🌟 Key Grading Features to Test

#### 1. ⚡ 8x Multi-Threaded Bulk Batch Scanner Studio (`/scan`)
- Navigate to the **Scan** tab.
- Click the cyan button **`⚡ Load & Scan Demo Batch (4 Cards)`**.
- Watch the **8x parallel execution engine** (`concurrent.futures.ThreadPoolExecutor`) process multiple business cards concurrently with real-time laser scribing and progress telemetry.

#### 2. 🔍 Global Spotlight Super-Search (`Ctrl + K` / `Cmd + K`)
- Press **`Ctrl + K`** (Windows) or click the **`Search ⌘K`** sidebar button on any page.
- Type names like `Brandon`, `Datality`, `ITE`, or `Nexus` to see instant fuzzy search results across contacts, companies, and ACRA UEN registry numbers.

#### 3. 🎨 WebGPU 3D Tactile Rolodex Carousel (`/home`)
- On the Home dashboard, interact with the interactive 3D WebGL Rolodex carousel.
- Click on any 3D card texture to inspect its live ACRA business profile and full contact details.

#### 4. 🌐 Interactive Entity Relationship Graph (`/graph`)
- Navigate to the **Graph** tab to view the D3.js force-directed network map connecting companies, colleagues, and executive nodes.
- Hover over nodes to inspect real-time telemetry cards.

#### 5. 📊 28+ Column Metadata CSV & ACRA Compliance Export (`/ledger`)
- Navigate to the **Ledger** tab (`/ledger`).
- Click **`Export Master CSV`** or **`Export ACRA Report`** to download a structured dataset with 28+ enriched fields (ACRA UEN, Paid-Up Capital, SSIC Code, Address, Timezone, CEO/CTO Intel, Confidence Scores).

---

## 🧪 Automated Codebase Audit & Unit Verification

To verify that all routes, Jinja2 templates, and modules build with **0 syntax errors**, run the automated test suite:

```bash
python audit_codebase.py
```

Expected output:
```text
============================================================
1. COMPILATION & SYNTAX CHECK
============================================================
  [OK] 21 Python files checked, Errors: 0

============================================================
2. FLASK TEST CLIENT ROUTE VERIFICATION
============================================================
  [OK] GET / -> 200
  [OK] GET /login -> 200
  [OK] GET /home -> 200
  [OK] GET /workbench -> 200
  [OK] GET /scan -> 200
  [OK] GET /graph -> 200
  [OK] GET /ledger -> 200

============================================================
3. JINJA2 TEMPLATE SYNTAX VALIDATION
============================================================
  [OK] All 11 templates verified

============================================================
FINAL AUDIT RESULT: ALL PASS - ZERO BUGS
============================================================
```

---

## 📄 Standalone Technical Verification Script

To execute a standalone demonstration of OCR parsing, ACRA entity verification, and email dispatch in the terminal:
```bash
python leadflow_poc/leadflow_explain.py
```

---

## ❓ Troubleshooting & FAQ

#### Q1: PowerShell says `Execution_of_scripts_is_disabled_on_this_system`
* **Solution:** Open PowerShell and run:
  ```powershell
  Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
  ```
  Then activate `.venv` again: `.\.venv\Scripts\Activate.ps1`

#### Q2: `Port 5000 is already in use`
* **Solution:** Another application is using port 5000. You can change the port in `leadflow_poc/app.py` on line 1123 (`app.run(port=5001)`) or terminate the existing process.

#### Q3: `python is not recognized as an internal or external command`
* **Solution:** Ensure Python 3.10+ is installed and that the option **"Add Python to PATH"** was selected during installation. You can also run using `py` launcher: `py -m venv .venv`.

---

## 👥 Authors & Capstone Team
* **Project:** CP001 — LeadFlow AI
* **Course:** CI2501D AI Capstone Project
* **Institution:** Institute of Technical Education (ITE)
