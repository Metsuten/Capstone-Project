# ==============================================================================
# LEADFLOW AI — CRM SYNC PIPELINE (crm_sync.py)
# ==============================================================================
# Handles formatting, deduplication, and HTTP POST of verified lead payloads
# to an external CRM webhook endpoint. Supports both single-record and batch
# sync operations with structured error handling and audit logging.
# ==============================================================================

import os
import json
import time
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

# We use urllib so there are zero extra dependencies required
import urllib.request
import urllib.error

# ---------------------------------------------------------------------------
# CONFIGURATION
# ---------------------------------------------------------------------------
DEFAULT_WEBHOOK_URL = "https://webhook.site"  # Safe demo target
CRM_WEBHOOK_URL = os.environ.get("CRM_WEBHOOK_URL", DEFAULT_WEBHOOK_URL)

# ---------------------------------------------------------------------------
# PAYLOAD FORMATTER
# ---------------------------------------------------------------------------

def format_crm_payload(lead: Dict[str, Any]) -> Dict[str, Any]:
    """
    Transforms internal LeadFlow schema into a CRM-compatible JSON payload.
    Adds metadata fields required by typical marketing automation platforms
    (HubSpot, Salesforce, etc.).
    """
    now = datetime.now(timezone.utc).isoformat()

    payload = {
        # --- Identity ---
        "contact": {
            "firstName":      lead.get("firstName", ""),
            "lastName":       lead.get("lastName", ""),
            "email":          lead.get("email", ""),
            "secondaryEmail": lead.get("secondaryEmail", ""),
            "phone":          lead.get("phone", ""),
            "secondaryPhone": lead.get("secondaryPhone", ""),
            "jobTitle":       lead.get("jobTitle", ""),
            "linkedin":       lead.get("linkedin", ""),
            "twitter":        lead.get("twitter", ""),
            "instagram":      lead.get("instagram", ""),
            "facebook":       lead.get("facebook", ""),
        },

        # --- Company ---
        "company": {
            "name":     lead.get("companyName", ""),
            "code":     lead.get("companyCode", ""),
            "industry": lead.get("industry", ""),
        },

        # --- Address ---
        "address": {
            "street":  lead.get("street", ""),
            "city":    lead.get("city", ""),
            "state":   lead.get("state", ""),
            "country": lead.get("country", ""),
            "zipCode": lead.get("zipCode", ""),
        },

        # --- CRM Metadata ---
        "crm_metadata": {
            "source":                "LeadFlow AI — Business Card Scanner",
            "sync_timestamp":        now,
            "confidence_score":      lead.get("confidence_score", 0),
            "customer_code":         lead.get("customerCode", ""),
            "customer_type":         lead.get("customerType", "prospect"),
            "customer_type_internal":lead.get("customerTypeInternal", ""),
            "engagement_type":       lead.get("engagementType", ""),
            "engagement_date":       lead.get("engagementDate", ""),
            "renewal_date":          lead.get("renewal_date", ""),
            "preferred_contact":     lead.get("preferredContactMethod", "email"),
            "status":                lead.get("status", "active"),
            "timezone":              lead.get("timezone", ""),
            "idd_code":              lead.get("idd_code", ""),
            "tags":                  lead.get("tags", ""),
            "notes":                 lead.get("notes", ""),
        },
    }

    return payload


# ---------------------------------------------------------------------------
# SINGLE RECORD SYNC
# ---------------------------------------------------------------------------

def sync_lead_to_crm(
    lead: Dict[str, Any],
    webhook_url: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Formats a lead record and POSTs it to the CRM webhook endpoint.

    Returns a result dict:
        {
            "success": bool,
            "status_code": int | None,
            "message": str,
            "payload": dict,        # the formatted payload that was sent
            "response_body": str,   # raw response text
            "elapsed_ms": float,
        }
    """
    url = webhook_url or CRM_WEBHOOK_URL
    payload = format_crm_payload(lead)
    json_bytes = json.dumps(payload, indent=2).encode("utf-8")

    result: Dict[str, Any] = {
        "success":       False,
        "status_code":   None,
        "message":       "",
        "payload":       payload,
        "response_body": "",
        "elapsed_ms":    0,
    }

    start = time.monotonic()

    try:
        req = urllib.request.Request(
            url,
            data=json_bytes,
            headers={
                "Content-Type": "application/json",
                "User-Agent": "LeadFlowAI/1.0",
                "X-LeadFlow-Source": "business-card-scanner",
            },
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            result["status_code"]   = resp.status
            result["response_body"] = resp.read().decode("utf-8", errors="replace")[:2000]
            result["success"]       = 200 <= resp.status < 300
            result["message"]       = "Sync successful" if result["success"] else f"Unexpected HTTP {resp.status}"

    except urllib.error.HTTPError as e:
        result["status_code"]   = e.code
        result["response_body"] = e.read().decode("utf-8", errors="replace")[:2000]
        result["message"]       = f"HTTP Error {e.code}: {e.reason}"

    except urllib.error.URLError as e:
        result["message"] = f"Connection failed: {e.reason}"

    except TimeoutError:
        result["message"] = "Request timed out after 15 seconds"

    except Exception as e:
        result["message"] = f"Unexpected error: {str(e)}"

    result["elapsed_ms"] = round((time.monotonic() - start) * 1000, 1)
    return result


# ---------------------------------------------------------------------------
# BATCH SYNC
# ---------------------------------------------------------------------------

def batch_sync(
    leads: List[Dict[str, Any]],
    webhook_url: Optional[str] = None,
    on_progress=None,
) -> Dict[str, Any]:
    """
    Syncs a list of leads to the CRM webhook one by one.

    Args:
        leads: list of lead dicts
        webhook_url: override webhook URL
        on_progress: optional callback(index, total, result) called after each lead

    Returns:
        {
            "total":     int,
            "succeeded": int,
            "failed":    int,
            "results":   [result_dict, ...],
            "elapsed_ms": float,
        }
    """
    batch_start = time.monotonic()
    results = []
    succeeded = 0
    failed = 0

    for i, lead in enumerate(leads):
        r = sync_lead_to_crm(lead, webhook_url=webhook_url)
        results.append(r)

        if r["success"]:
            succeeded += 1
        else:
            failed += 1

        if on_progress:
            on_progress(i, len(leads), r)

    return {
        "total":      len(leads),
        "succeeded":  succeeded,
        "failed":     failed,
        "results":    results,
        "elapsed_ms": round((time.monotonic() - batch_start) * 1000, 1),
    }
