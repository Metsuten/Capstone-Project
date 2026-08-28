/**
 * LeadFlow AI CRM - Client-Side JavaScript
 * MX v3.0 Dark Canvas Design
 */

document.addEventListener('DOMContentLoaded', () => {
    initKeyboardShortcuts();
    setupToastContainer();
    initPageSpecificLogic();
});

// ==========================================
// 1. Navigation & Page Utils
// ==========================================

/**
 * Redirects the user to a specific URL
 * @param {string} url - The URL to navigate to
 */
function navigateTo(url) {
    window.location.href = url;
}

let toastTimeout;

/**
 * Creates the toast container if it doesn't exist
 */
function setupToastContainer() {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    container.style.position = 'fixed';
    container.style.top = '24px';
    container.style.right = '24px';
    container.style.zIndex = '999999';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '12px';
    container.style.pointerEvents = 'none';
}

/**
 * Shows a toast notification
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} type - 'success', 'error', 'warning', 'info'
 */
function showNotification(title, message, type = 'info') {
    setupToastContainer();
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.style.pointerEvents = 'auto';
    toast.style.display = 'flex';
    toast.style.alignItems = 'center';
    toast.style.gap = '12px';
    toast.style.padding = '14px 20px';
    toast.style.borderRadius = '14px';
    toast.style.background = 'rgba(11, 16, 25, 0.95)';
    toast.style.backdropFilter = 'blur(16px)';
    toast.style.transition = 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
    toast.style.transform = 'translateY(-20px)';
    toast.style.opacity = '0';
    toast.style.maxWidth = '420px';

    let borderColor = 'rgba(62, 207, 142, 0.5)';
    let glowColor = 'rgba(62, 207, 142, 0.2)';
    let icon = '✓';
    let iconBg = 'rgba(62, 207, 142, 0.2)';
    let iconColor = '#3ECF8E';

    if (type === 'error') {
        borderColor = 'rgba(244, 63, 94, 0.5)';
        glowColor = 'rgba(244, 63, 94, 0.2)';
        icon = '✕';
        iconBg = 'rgba(244, 63, 94, 0.2)';
        iconColor = '#F43F5E';
    } else if (type === 'warning') {
        borderColor = 'rgba(245, 158, 11, 0.5)';
        glowColor = 'rgba(245, 158, 11, 0.2)';
        icon = '⚠';
        iconBg = 'rgba(245, 158, 11, 0.2)';
        iconColor = '#F59E0B';
    }

    toast.style.border = `1px solid ${borderColor}`;
    toast.style.boxShadow = `0 10px 30px rgba(0,0,0,0.6), 0 0 20px ${glowColor}`;

    toast.innerHTML = `
        <div style="width: 32px; height: 32px; border-radius: 10px; background: ${iconBg}; color: ${iconColor}; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 16px; flex-shrink: 0;">${icon}</div>
        <div style="flex: 1; display: flex; flex-direction: column; gap: 2px;">
            <div style="font-weight: 800; font-size: 14px; color: #FFF;">${title}</div>
            <div style="font-size: 12px; color: rgba(255,255,255,0.8);">${message}</div>
        </div>
        <button onclick="this.parentElement.remove()" style="background: transparent; border: none; color: rgba(255,255,255,0.4); cursor: pointer; font-size: 16px; padding: 4px;">✕</button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.transform = 'translateY(0)';
        toast.style.opacity = '1';
    }, 10);

    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-10px)';
            setTimeout(() => toast.remove(), 300);
        }
    }, 4000);
}

/**
 * Hides all toast notifications
 */
function hideNotification() {
    const container = document.getElementById('toast-container');
    if (container) {
        container.innerHTML = '';
    }
}

/**
 * Shows a loading spinner overlay on the given element
 * @param {HTMLElement|string} element - Element or selector
 */
function showLoading(element) {
    const target = typeof element === 'string' ? document.querySelector(element) : element;
    if (!target) return;
    
    const overlay = document.createElement('div');
    overlay.className = 'absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-40 loading-overlay rounded';
    overlay.innerHTML = `
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-400"></div>
    `;
    
    // Ensure parent is positioned relatively if static
    const computedStyle = window.getComputedStyle(target);
    if (computedStyle.position === 'static') {
        target.classList.add('relative');
    }
    
    target.appendChild(overlay);
}

/**
 * Removes loading spinner from element
 * @param {HTMLElement|string} element - Element or selector
 */
function hideLoading(element) {
    const target = typeof element === 'string' ? document.querySelector(element) : element;
    if (!target) return;
    
    const overlay = target.querySelector('.loading-overlay');
    if (overlay) {
        overlay.remove();
    }
}

// ==========================================
// 2. API Helper
// ==========================================

/**
 * Generic API fetch wrapper
 * @param {string} endpoint - API endpoint URL
 * @param {string} method - HTTP method (GET, POST, etc)
 * @param {Object|FormData} data - Data to send
 * @param {boolean} isFormData - Whether data is FormData
 * @returns {Promise<Object>} Parsed JSON response
 */
async function apiCall(endpoint, method = 'GET', data = null, isFormData = false) {
    const options = {
        method,
        headers: {}
    };

    if (data) {
        if (isFormData) {
            options.body = data;
        } else {
            options.headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(data);
        }
    }

    try {
        const response = await fetch(endpoint, options);
        let result;
        
        try {
            result = await response.json();
        } catch (e) {
            // Handle non-JSON responses
            if (!response.ok) {
                throw new Error(response.statusText);
            }
            return { success: true };
        }

        if (!response.ok) {
            throw new Error(result.error || result.message || 'API request failed');
        }

        return result;
    } catch (error) {
        showNotification('Error', error.message, 'error');
        throw error;
    }
}

// ==========================================
// 3. Login Page
// ==========================================

/**
 * Login as a specific persona
 * @param {string} profile - Profile name (alex, elena, damon, guest)
 */
async function loginAs(profile) {
    try {
        await apiCall('/api/login', 'POST', { profile });
        navigateTo('/home');
    } catch (e) {
        console.error('Login failed:', e);
    }
}

/**
 * Enter as guest user
 */
function enterAsGuest() {
    loginAs('guest');
}

// ==========================================
// 4. Scan Wizard
// ==========================================

let currentStep = 1;

/**
 * Navigate between wizard steps
 * @param {number} step - Step number to show
 */
function goToStep(step) {
    // Hide all step contents
    document.querySelectorAll('.scan-step').forEach(el => el.style.display = 'none');
    
    // Update active state on indicators
    document.querySelectorAll('.wizard-step').forEach((el, index) => {
        if (index + 1 === step) {
            el.classList.add('active');
            el.classList.remove('completed');
        } else if (index + 1 < step) {
            el.classList.add('completed');
            el.classList.remove('active');
        } else {
            el.classList.remove('active', 'completed');
        }
    });

    const stepEl = document.getElementById(`step-${step}-content`);
    if (stepEl) {
        stepEl.style.display = 'block';
        currentStep = step;
    }
}

/**
 * Handle image file selection
 * @param {HTMLInputElement} inputElement - The file input
 * @param {string} side - 'front' or 'back'
 */
function handleFileUpload(inputElement, side) {
    if (inputElement.files && inputElement.files[0]) {
        const file = inputElement.files[0];
        const previewElement = document.getElementById(`${side}-preview`);
        if (previewElement) {
            previewImage(file, previewElement);
            previewElement.classList.remove('hidden');
        }
        
        // Show next button if front is uploaded
        if (side === 'front') {
            const nextBtn = document.getElementById('btn-next-step');
            if (nextBtn) nextBtn.disabled = false;
        }
    }
}

/**
 * Skip back card upload
 */
function skipBackCard() {
    const backInput = document.getElementById('back-file-input');
    if (backInput) backInput.value = ''; // clear
    goToStep(3);
    submitScan();
}

function compressImageForUpload(file, maxDimension = 1400, quality = 0.85) {
    return new Promise((resolve) => {
        if (!file || !file.type || !file.type.startsWith('image/')) {
            return resolve(file);
        }
        const img = new Image();
        const reader = new FileReader();
        reader.onload = (e) => {
            img.onload = () => {
                let width = img.width;
                let height = img.height;
                if (width > maxDimension || height > maxDimension) {
                    if (width > height) {
                        height = Math.round((height * maxDimension) / width);
                        width = maxDimension;
                    } else {
                        width = Math.round((width * maxDimension) / height);
                        height = maxDimension;
                    }
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob((blob) => {
                    if (blob && blob.size < file.size) {
                        const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), { type: 'image/jpeg' });
                        resolve(compressedFile);
                    } else {
                        resolve(file);
                    }
                }, 'image/jpeg', quality);
            };
            img.onerror = () => resolve(file);
            img.src = e.target.result;
        };
        reader.onerror = () => resolve(file);
        reader.readAsDataURL(file);
    });
}

/**
 * Submit the scan form
 */
async function submitScan() {
    const frontInput = document.getElementById('front-file-input');
    const backInput = document.getElementById('back-file-input');
    
    if (!frontInput || !frontInput.files[0]) {
        showNotification('Required', 'Front image is required', 'warning');
        goToStep(1);
        return;
    }

    goToStep(3); // Show extraction step

    // Start loading timer & continuous progress animation
    const timerEl = document.getElementById('extraction-timer');
    const pctBadge = document.getElementById('extraction-pct-badge');
    const statusTextEl = document.getElementById('extraction-dynamic-status');
    const progressFill = document.getElementById('extraction-progress');
    const dotOcr = document.getElementById('dot-ocr');
    const dotEnrich = document.getElementById('dot-enrich');
    const dotInfer = document.getElementById('dot-infer');
    const stageEnrich = document.getElementById('stage-enrich');
    const stageInfer = document.getElementById('stage-infer');

    const startTime = performance.now();
    let currentPct = 15;
    if (progressFill) progressFill.style.width = `${currentPct}%`;

    const timerInterval = setInterval(() => {
        const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
        if (timerEl) {
            timerEl.textContent = `Time elapsed: ${elapsed}s`;
        }

        // Smooth continuous progress increment up to 94%
        if (currentPct < 94) {
            currentPct += (94 - currentPct) * 0.05 + 0.5;
            const displayPct = Math.min(94, Math.round(currentPct));
            if (progressFill) progressFill.style.width = `${displayPct}%`;
            if (pctBadge) pctBadge.textContent = `${displayPct}% Processing`;
        }

        // Dynamic stage updates & telemetry status text
        if (elapsed < 1.0) {
            if (statusTextEl) statusTextEl.textContent = "Scanning front & back typography matrix with Gemini Vision OCR...";
        } else if (elapsed >= 1.0 && elapsed < 2.2) {
            if (statusTextEl) statusTextEl.textContent = "Cross-referencing entity with official Singapore ACRA Government Registry...";
            if (dotEnrich) {
                dotEnrich.style.background = '#3ECF8E';
                dotEnrich.style.boxShadow = '0 0 12px #3ECF8E';
                dotEnrich.style.animation = 'aiStagePulse 1.5s infinite';
            }
            if (dotOcr) dotOcr.style.animation = 'none';
            if (stageEnrich) stageEnrich.style.color = '#3ECF8E';
        } else if (elapsed >= 2.2) {
            if (statusTextEl) statusTextEl.textContent = "Synthesizing executive pitch angles, icebreakers & CRM intelligence...";
            if (dotInfer) {
                dotInfer.style.background = '#3ECF8E';
                dotInfer.style.boxShadow = '0 0 12px #3ECF8E';
                dotInfer.style.animation = 'aiStagePulse 1.5s infinite';
            }
            if (dotEnrich) dotEnrich.style.animation = 'none';
            if (stageInfer) stageInfer.style.color = '#3ECF8E';
        }
    }, 100);

    const compressedFront = await compressImageForUpload(frontInput.files[0]);
    const formData = new FormData();
    formData.append('front_image', compressedFront);
    
    if (backInput && backInput.files[0]) {
        const compressedBack = await compressImageForUpload(backInput.files[0]);
        formData.append('back_image', compressedBack);
    }

    const projectSlug = document.getElementById('scan-project-selector')?.value;
    if (projectSlug) {
        formData.append('project_slug', projectSlug);
    }
    
    try {
        const response = await apiCall('/api/scan', 'POST', formData, true);
        clearInterval(timerInterval);
        const finalElapsed = ((performance.now() - startTime) / 1000).toFixed(1);
        if (timerEl) {
            timerEl.textContent = `✓ Completed in: ${finalElapsed}s`;
        }
        if (pctBadge) pctBadge.textContent = "100% Complete";
        if (progressFill) progressFill.style.width = '100%';
        if (statusTextEl) statusTextEl.textContent = "Extraction complete! Ingesting to Intelligence Workbench...";

        showNotification('Success', `Card processed & verified in ${finalElapsed}s`, 'success');
        setTimeout(() => navigateTo('/workbench'), 500);
    } catch (e) {
        clearInterval(timerInterval);
        showNotification('Extraction Failed', e.message || 'Error processing card', 'error');
        goToStep(1);
    }
}

// ==========================================
// 5. Workbench
// ==========================================

/**
 * Commit workbench form to CRM
 */
async function commitToCRM() {
    const form = document.getElementById('workbench-form');
    if (!form) return;

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // Create custom loading overlay
    const overlay = document.createElement('div');
    overlay.className = 'crm-overlay';
    overlay.innerHTML = `
        <div class="glass-card crm-popup">
            <div class="crm-spinner" id="crm-spinner"></div>
            <h2 class="crm-title" id="crm-title">Syncing to CRM</h2>
            <p class="crm-status" id="crm-status-text">Analyzing database for duplicates...</p>
        </div>
    `;
    document.body.appendChild(overlay);

    try {
        const result = await apiCall('/api/commit', 'POST', data);
        
        const statusText = document.getElementById('crm-status-text');
        const title = document.getElementById('crm-title');
        const spinner = document.getElementById('crm-spinner');
        
        // Switch out spinner for an icon
        spinner.className = 'crm-icon-check';
        spinner.innerHTML = '✓';
        
        if (result.is_duplicate) {
            title.textContent = 'Lead Updated';
            title.style.color = 'var(--color-warning)';
            spinner.style.color = 'var(--color-warning)';
            overlay.querySelector('.crm-popup').style.borderColor = 'var(--color-warning)';
            overlay.querySelector('.crm-popup').style.boxShadow = '0 0 30px rgba(245,158,11,0.2)';
            statusText.textContent = 'Duplicate detected. Existing record updated successfully.';
        } else {
            title.textContent = 'Lead Committed';
            spinner.style.color = 'var(--color-primary)';
            statusText.textContent = 'New record securely added to Ledger.';
        }
        
        setTimeout(() => {
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.remove();
                navigateTo('/ledger');
            }, 300);
        }, 2000);
        
    } catch (e) {
        overlay.remove();
        showNotification('Commit Failed', e.message || 'An error occurred', 'error');
    }
}

/**
 * Toggle visibility of JSON payload preview
 */
function showJsonPayload() {
    const panel = document.getElementById('json-preview-panel');
    if (panel) {
        panel.classList.toggle('hidden');
        
        // Update payload if opening
        if (!panel.classList.contains('hidden')) {
            const form = document.getElementById('workbench-form');
            if (form) {
                const formData = new FormData(form);
                const data = Object.fromEntries(formData.entries());
                const pre = panel.querySelector('pre');
                if (pre) pre.textContent = JSON.stringify(data, null, 2);
            }
        }
    }
}

// ==========================================
// 6. Review Queue
// ==========================================

/**
 * Approve a record in review
 * @param {string|number} leadId 
 */
async function approveRecord(leadId) {
    const container = document.getElementById(`record-${leadId}`) || document.body;
    showLoading(container);
    
    try {
        // Collect updated data if there's a form for this record
        const form = document.getElementById(`form-${leadId}`);
        const data = form ? Object.fromEntries(new FormData(form).entries()) : {};
        data.status = 'SYNCED';
        data.id = leadId;

        await apiCall('/api/review/save', 'POST', data);
        showNotification('Approved', 'Record saved and synced', 'success');
        
        // Remove from DOM or refresh
        if (container !== document.body) {
            container.remove();
        } else {
            setTimeout(() => window.location.reload(), 1000);
        }
    } catch (e) {
        hideLoading(container);
    }
}

/**
 * Delete a record
 * @param {string|number} leadId 
 */
async function deleteRecord(leadId) {
    showConfirmModal('Delete Record', 'Are you sure you want to delete this record? This cannot be undone.', async () => {
        try {
            await apiCall(`/api/delete/${leadId}`, 'POST');
            showNotification('Deleted', 'Record removed', 'info');
            const row = document.getElementById(`row-${leadId}`) || document.getElementById(`record-${leadId}`);
            if (row) {
                row.remove();
            } else {
                window.location.reload();
            }
        } catch (e) {
            console.error('Delete failed:', e);
        }
    });
}

// ==========================================
// 7. Ledger
// ==========================================

/**
 * Trigger ACRA Singapore Registry Sync & AI Data Update for all records
 */
async function updateAcraSync() {
    showNotification('ACRA Sync Active', 'Querying Singapore ACRA Registry & AI enrichment for all records...', 'info');

    try {
        const res = await apiCall('/api/update_acra', 'POST');
        showNotification('ACRA Update Complete', `Successfully verified and updated ${res.updated_count || 0} records with ACRA & AI data!`, 'success');
        setTimeout(() => window.location.reload(), 1200);
    } catch (e) {
        showNotification('ACRA Update Failed', e.message || 'Error updating ACRA data', 'error');
    }
}

/**
 * Trigger ACRA Registry & AI Update for a single lead ID
 * @param {string|number} leadId
 */
async function updateSingleLead(leadId) {
    showNotification('ACRA Lead Re-Sync', `Re-syncing Lead ID-${leadId} with ACRA & AI enrichment...`, 'info');

    try {
        const res = await apiCall('/api/update_single_lead', 'POST', { lead_id: leadId });
        showNotification('Lead Updated', `Lead ID-${leadId} successfully updated with ACRA government data!`, 'success');
        setTimeout(() => window.location.reload(), 1000);
    } catch (e) {
        showNotification('Lead Update Failed', e.message || 'Error updating lead', 'error');
    }
}

/**
 * Toggle/sync status of a lead between SYNCED and Pending
 * @param {string|number} leadId
 */
async function toggleLeadStatus(leadId) {
    showNotification('Status Sync', `Syncing status for Lead ID-${leadId}...`, 'info');
    try {
        const res = await apiCall('/api/toggle_status', 'POST', { lead_id: leadId });
        showNotification('Status Updated', `Lead ID-${leadId} is now ${res.new_status}!`, 'success');
        setTimeout(() => window.location.reload(), 800);
    } catch (e) {
        showNotification('Status Sync Failed', e.message || 'Error syncing status', 'error');
    }
}

/**
 * Send email to all valid contacts
 */
async function emailAll() {
    showConfirmModal('Send Emails', 'Send template emails to all valid contacts?', async () => {
        const container = document.getElementById('ledger-container') || document.body;
        showLoading(container);

        try {
            const result = await apiCall('/api/email-all', 'POST');
            showNotification('Emails Sent', `Successfully sent ${result.sent || 0} emails. Failed: ${result.failed || 0}`, 'success');
            setTimeout(() => window.location.reload(), 2000);
        } catch (e) {
            hideLoading(container);
        }
    });
}

/**
 * Toggle export dropdown menu
 */
function toggleExportMenu(e) {
    if (e) e.stopPropagation();
    const menu = document.getElementById('export-dropdown-menu');
    if (menu) {
        menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex';
    }
}

document.addEventListener('click', () => {
    const menu = document.getElementById('export-dropdown-menu');
    if (menu) menu.style.display = 'none';
});

/**
 * Export data in specified format (csv, acra, json)
 * @param {string} format
 */
function exportData(format = 'csv') {
    window.location.href = `/api/export?format=${format}`;
    showNotification('Export Initiated', `Downloading LeadFlow dataset as ${format.toUpperCase()}...`, 'success');
}

function exportCSV() {
    exportData('csv');
}

/**
 * Filter table rows
 */
function filterTable() {
    const searchInput = document.getElementById('ledger-search');
    const statusSelect = document.getElementById('status-filter');
    const confSelect = document.getElementById('confidence-filter');
    const indSelect = document.getElementById('industry-filter');
    
    if (!searchInput) return;

    const searchText = searchInput.value.toLowerCase();
    const statusFilter = statusSelect ? statusSelect.value : 'all';
    const confFilter = confSelect ? confSelect.value : 'all';
    const indFilter = indSelect ? indSelect.value : 'all';

    const rows = document.querySelectorAll('.ledger-row');

    rows.forEach(row => {
        const textContent = (row.dataset.search || row.textContent).toLowerCase();
        const status = row.dataset.status || '';
        const conf = parseInt(row.dataset.confidence || '0', 10);
        const industry = row.dataset.industry || '';

        const matchesSearch = textContent.includes(searchText);
        const matchesStatus = statusFilter === 'all' || status === statusFilter;
        
        let matchesConf = true;
        if (confFilter === 'high') matchesConf = conf >= 80;
        else if (confFilter === 'med') matchesConf = conf >= 50 && conf < 80;
        else if (confFilter === 'low') matchesConf = conf < 50;

        const matchesInd = indFilter === 'all' || industry === indFilter;

        if (matchesSearch && matchesStatus && matchesConf && matchesInd) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

/**
 * Toggle right-side audit trail
 */
function toggleAuditTrail() {
    const drawer = document.getElementById('audit-drawer');
    if (drawer) {
        drawer.classList.toggle('translate-x-full');
    }
}

/**
 * Select a record in the ledger table
 * @param {string|number} leadId 
 */
function selectRecord(leadId) {
    // Highlight row
    document.querySelectorAll('.ledger-row').forEach(row => row.classList.remove('bg-gray-800/50'));
    const selectedRow = document.getElementById(`row-${leadId}`);
    if (selectedRow) selectedRow.classList.add('bg-gray-800/50');

    // Show details (implementation depends on UI)
    // Could fetch details via API or read from data attributes
    const inspector = document.getElementById('record-inspector');
    if (inspector) {
        // Populating inspector logic...
        inspector.classList.remove('hidden');
    }
}

// ==========================================
// 10. Confirmation Modals
// ==========================================

/**
 * Displays a confirmation modal
 * @param {string} title 
 * @param {string} message 
 * @param {Function} onConfirm 
 */
function showConfirmModal(title, message, onConfirm) {
    // Remove any existing confirm modal overlays to prevent stacking!
    document.querySelectorAll('#confirm-modal').forEach(el => el.remove());

    const modal = document.createElement('div');
    modal.id = 'confirm-modal';
    modal.className = 'modal-overlay';
    modal.style.display = 'flex';
    modal.style.position = 'fixed';
    modal.style.inset = '0';
    modal.style.background = 'rgba(0, 0, 0, 0.75)';
    modal.style.backdropFilter = 'blur(12px)';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = '99999';

    modal.innerHTML = `
        <div class="modal-card glass-card" style="max-width: 420px; width: 90%; padding: 28px; border-radius: 20px; border: 1px solid rgba(244, 63, 94, 0.3); background: #0B1019; box-shadow: 0 20px 50px rgba(0,0,0,0.8);">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                <div style="width: 40px; height: 40px; border-radius: 12px; background: rgba(244, 63, 94, 0.15); border: 1px solid rgba(244, 63, 94, 0.3); display: flex; align-items: center; justify-content: center; color: #F43F5E; font-size: 20px;">🗑</div>
                <h3 style="font-size: 20px; margin: 0; color: #FFF;">${title}</h3>
            </div>
            <p style="color: rgba(255, 255, 255, 0.7); font-size: 14px; margin-bottom: 24px; line-height: 1.5;">${message}</p>
            <div style="display: flex; justify-content: flex-end; gap: 12px;">
                <button onclick="hideModal()" class="btn btn-secondary" style="padding: 10px 18px;">Cancel</button>
                <button id="modal-confirm-btn" class="btn btn-danger" style="padding: 10px 18px; font-weight: 700;">Confirm Delete</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const confirmBtn = modal.querySelector('#modal-confirm-btn');
    confirmBtn.onclick = () => {
        if (onConfirm) onConfirm();
        hideModal();
    };
}

/**
 * Hides the open modal
 */
function hideModal() {
    document.querySelectorAll('#confirm-modal').forEach(el => el.remove());
}

// ==========================================
// 11. Image Preview
// ==========================================

/**
 * Preview uploaded file in an image element
 * @param {File} file 
 * @param {HTMLImageElement} previewElement 
 */
function previewImage(file, previewElement) {
    if (!file || !file.type.match('image.*')) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        previewElement.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// ==========================================
// 12. Dark Theme & Setup Helpers
// ==========================================

/**
 * Initialize keyboard shortcuts
 */
function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Cmd+K or Ctrl+K for search focus
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            const searchInput = document.getElementById('search-input');
            if (searchInput) searchInput.focus();
        }
        
        // Escape to close modals/panels
        if (e.key === 'Escape') {
            hideModal();
            const drawer = document.getElementById('audit-drawer');
            if (drawer && !drawer.classList.contains('translate-x-full')) {
                drawer.classList.add('translate-x-full');
            }
        }
    });
}

/**
 * Page-specific initializations
 */
function initPageSpecificLogic() {
    // Ledger page
    if (window.location.pathname.includes('/ledger')) {
        const searchInput = document.getElementById('ledger-search');
        const statusFilter = document.getElementById('status-filter');
        const confFilter = document.getElementById('confidence-filter');
        const indFilter = document.getElementById('industry-filter');
        
        if (indFilter) {
            // Populate industry filter dynamically
            const rows = document.querySelectorAll('.ledger-row');
            const industries = new Set();
            rows.forEach(r => {
                if (r.dataset.industry) industries.add(r.dataset.industry);
            });
            Array.from(industries).sort().forEach(ind => {
                const opt = document.createElement('option');
                opt.value = ind;
                opt.textContent = ind.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                indFilter.appendChild(opt);
            });
        }
        
        if (searchInput) {
            searchInput.focus();
            // Setup filter listeners
            searchInput.addEventListener('input', filterTable);
        }

        if (statusFilter) statusFilter.addEventListener('change', filterTable);
        if (confFilter) confFilter.addEventListener('change', filterTable);
        if (indFilter) indFilter.addEventListener('change', filterTable);
        
        // Initial filter application
        filterTable();
    }

    // Review page
    if (window.location.pathname.includes('/review')) {
        const searchInput = document.getElementById('review-search');
        const confToggle = document.getElementById('review-conf-toggle');
        const missingToggle = document.getElementById('review-missing-toggle');

        function filterReviewQueue() {
            const searchText = (searchInput ? searchInput.value : '').toLowerCase();
            const showOnlyLowConf = confToggle ? confToggle.checked : false;
            const showOnlyMissing = missingToggle ? missingToggle.checked : false;

            const items = document.querySelectorAll('.review-item');
            items.forEach(item => {
                const textContent = (item.dataset.search || '').toLowerCase();
                const conf = parseFloat(item.dataset.conf || '1.0');
                const isMissing = item.dataset.missing === 'true';

                const matchesSearch = textContent.includes(searchText);
                const matchesConf = !showOnlyLowConf || conf < 0.8;
                const matchesMissing = !showOnlyMissing || isMissing;

                if (matchesSearch && matchesConf && matchesMissing) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            });
        }

        if (searchInput) searchInput.addEventListener('input', filterReviewQueue);
        if (confToggle) confToggle.addEventListener('change', filterReviewQueue);
        if (missingToggle) missingToggle.addEventListener('change', filterReviewQueue);
        
        filterReviewQueue();
    }
}

// ==========================================
// 12. Email Studio
// ==========================================

function openEmailStudio(mode = 'single') {
    const modal = document.getElementById('email-studio-modal');
    if (modal) {
        modal.style.display = 'flex';
        setEmailStudioMode(mode);
    }
}

function closeEmailStudio() {
    const modal = document.getElementById('email-studio-modal');
    if (modal) {
        modal.style.display = 'none';
        // Reset single mode UI
        const container = document.getElementById('email-draft-container');
        if (container) container.style.display = 'none';
        const select = document.getElementById('email-target-select');
        if (select) select.selectedIndex = 0;
    }
}

function setEmailStudioMode(mode) {
    const singleSection = document.getElementById('email-studio-single');
    const bulkSection = document.getElementById('email-studio-bulk');
    const btnSingle = document.getElementById('btn-mode-single');
    const btnBulk = document.getElementById('btn-mode-bulk');
    
    if (mode === 'single') {
        if(singleSection) singleSection.style.display = 'block';
        if(bulkSection) bulkSection.style.display = 'none';
        if(btnSingle) btnSingle.classList.add('active');
        if(btnBulk) btnBulk.classList.remove('active');
    } else {
        if(singleSection) singleSection.style.display = 'none';
        if(bulkSection) bulkSection.style.display = 'block';
        if(btnSingle) btnSingle.classList.remove('active');
        if(btnBulk) btnBulk.classList.add('active');
    }
}

async function generateEmailDraft() {
    const select = document.getElementById('email-target-select');
    if (!select || !select.value) {
        showNotification('Warning', 'Please select a contact first.', 'warning');
        return;
    }
    
    const container = document.querySelector('.email-studio-card');
    showLoading(container);
    
    try {
        const result = await apiCall('/api/email/draft', 'POST', { lead_id: select.value });
        hideLoading(container);
        
        if (result.success && result.draft) {
            document.getElementById('email-draft-subject').value = result.draft.subject || '';
            document.getElementById('email-draft-body').value = result.draft.body || '';
            
            // Unhide the draft container
            document.getElementById('email-draft-container').style.display = 'block';
        }
    } catch (e) {
        hideLoading(container);
        showNotification('Error', 'Failed to generate draft.', 'error');
    }
}

async function sendSingleEmail() {
    const to = document.getElementById('email-test-to').value;
    const subject = document.getElementById('email-draft-subject').value;
    const body = document.getElementById('email-draft-body').value;
    
    if (!to || !subject || !body) {
        showNotification('Warning', 'Please fill in all email fields.', 'warning');
        return;
    }
    
    const btn = document.getElementById('btn-send-single');
    const oldText = btn.textContent;
    btn.textContent = 'Sending...';
    btn.disabled = true;
    
    try {
        const result = await apiCall('/api/email/send', 'POST', {
            subject: subject,
            body: body,
            override_recipient: to
        });
        
        btn.textContent = oldText;
        btn.disabled = false;
        
        if (result.success) {
            showNotification('Success', 'Test email sent successfully!', 'success');
            closeEmailStudio();
        }
    } catch (e) {
        btn.textContent = oldText;
        btn.disabled = false;
        showNotification('Error', e.message || 'Failed to send email.', 'error');
    }
}

async function updateAllACRA() {
    const btn = document.querySelector("button[onclick='updateAllACRA()']");
    let originalHtml = '';
    if (btn) {
        originalHtml = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = `<span style="display:inline-block; animation: spin 1s linear infinite; margin-right:6px;">⟳</span> Syncing ACRA Registry...`;
    }

    showNotification('Syncing ACRA Registry', 'Querying Singapore Government ACRA & corporate intelligence database...', 'info');

    try {
        const res = await apiCall('/api/update_acra', 'POST', {});
        if (res.success) {
            if (btn) {
                btn.style.borderColor = '#3ECF8E';
                btn.style.color = '#3ECF8E';
                btn.innerHTML = `✓ ${res.updated_count} Records Synced!`;
            }
            showNotification('ACRA Sync Complete!', `Successfully stamped ${res.updated_count} records with official UENs & addresses!`, 'success');
            setTimeout(() => window.location.reload(), 1000);
        }
    } catch (e) {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalHtml;
        }
        showNotification('Sync Failed', e.message || 'Error updating ACRA data', 'error');
    }
}

// ==========================================
// 13. SPOTLIGHT COMMAND K SEARCH PALETTE
// ==========================================

function openSpotlight() {
    const modal = document.getElementById('spotlight-modal');
    const input = document.getElementById('spotlight-input');
    if (modal && input) {
        modal.style.display = 'flex';
        input.value = '';
        input.focus();
        onSpotlightInput('');
    }
}

function closeSpotlight() {
    const modal = document.getElementById('spotlight-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

let spotlightDebounce;
let currentSpotlightResults = [];

async function onSpotlightInput(val) {
    clearTimeout(spotlightDebounce);
    const resultsContainer = document.getElementById('spotlight-results');
    if (!resultsContainer) return;

    if (!val || val.trim() === '') {
        currentSpotlightResults = [];
        resultsContainer.innerHTML = `<div class="text-muted" style="text-align: center; padding: 30px; font-size: 13px;">Type company name, contact, ACRA UEN, or job title...</div>`;
        return;
    }

    spotlightDebounce = setTimeout(async () => {
        try {
            const res = await apiCall(`/api/search_spotlight?q=${encodeURIComponent(val)}`);
            currentSpotlightResults = res.results || [];
            
            if (res.results && res.results.length > 0) {
                resultsContainer.innerHTML = res.results.map((item, idx) => {
                    const isCompany = item.type === 'company';
                    return `
                        <div onclick="window.location.href='${item.url}'" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; background: rgba(255,255,255,0.02); border: 1px solid ${isCompany ? 'rgba(56, 152, 236, 0.25)' : 'rgba(255,255,255,0.06)'}; border-radius: 12px; cursor: pointer; transition: all 0.2s ease; margin-bottom: 4px;" onmouseover="this.style.background='${isCompany ? 'rgba(56,152,236,0.1)' : 'rgba(62,207,142,0.08)'}'; this.style.borderColor='${isCompany ? '#3898EC' : '#3ECF8E'}'" onmouseout="this.style.background='rgba(255,255,255,0.02)'; this.style.borderColor='${isCompany ? 'rgba(56, 152, 236, 0.25)' : 'rgba(255,255,255,0.06)'}'">
                            <div style="display: flex; flex-direction: column; gap: 3px; max-width: 75%;">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span style="font-size: 14px; font-weight: 700; color: #FFF;">${item.name}</span>
                                    <span class="badge ${isCompany ? 'badge-primary' : 'badge-ai'}" style="font-size: 9.5px; padding: 1px 6px;">${item.detail_tag}</span>
                                </div>
                                <div style="font-size: 12px; color: ${isCompany ? '#3898EC' : 'rgba(255,255,255,0.7)'};">${item.subtitle}</div>
                                ${isCompany && item.current_project ? `<div style="font-size: 11px; color: #F59E0B; margin-top: 2px;">Active: <span style="color: rgba(255,255,255,0.85);">${item.current_project}</span></div>` : ''}
                                ${isCompany && item.net_worth ? `<div style="font-size: 11px; color: #3ECF8E;">Valuation: <span class="mono" style="color: #FFF;">${item.net_worth}</span></div>` : ''}
                            </div>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                ${!isCompany && item.confidence ? `<span class="mono accent" style="font-size: 11px; font-weight: 700;">${item.confidence}</span>` : ''}
                                <span class="btn btn-sm ${isCompany ? 'btn-primary' : 'btn-secondary'}" style="font-size: 11px; padding: 4px 10px;">${isCompany ? 'View Company →' : 'View Profile →'}</span>
                            </div>
                        </div>
                    `;
                }).join('');
            } else {
                resultsContainer.innerHTML = `<div class="text-muted" style="text-align: center; padding: 30px; font-size: 13px;">No matching companies or contacts found for "${val}".</div>`;
            }
        } catch (e) {
            resultsContainer.innerHTML = `<div class="text-muted" style="text-align: center; padding: 20px; font-size: 13px;">Error loading search results.</div>`;
        }
    }, 120);
}

// Enter key support on search input
document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('spotlight-input');
    if (input) {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && currentSpotlightResults.length > 0) {
                e.preventDefault();
                window.location.href = currentSpotlightResults[0].url;
            }
        });
    }
});

// Add global Cmd+K / Ctrl+K keyboard shortcut listener
document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openSpotlight();
    }
    if (e.key === 'Escape') {
        closeSpotlight();
    }
});
