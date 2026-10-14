# Security Audit: Travel Document Management & Academic Resources

**Feature Scope:** Travel Document Storage, Trip Document Requirements, File Size & MIME Restrictions, In-App Previews, and Academic PDF Resources  
**Reference Document:** `C:\projects\Prebuild Assets\Vibe_Coder_Attacks_Guide.pdf`  
**Date:** 2026-10-13  

---

## 1. Executive Summary

Document upload systems introduce attack vectors including arbitrary file execution, stored Cross-Site Scripting (XSS), server-side resource exhaustion, unauthorized cross-tenant data access, and sensitive Personally Identifiable Information (PII) leakage (such as passport copies and visa scans).

This audit evaluates the architecture against enterprise security standards, Row Level Security (RLS) policies, storage access controls, input sanitization, and India localization standards.

---

## 2. Threat Modeling & Vulnerability Findings

### 🔴 Finding 1: Unrestricted Client Blob URLs & Lack of Storage Enforcement (CRITICAL - PREVIOUS CODE DEFECT)
- **Vulnerability:** The existing frontend stored client-side blob URLs (`blob:http://localhost:3001/...`) directly in the `documents.file_url` column. No backend upload handler or private storage bucket enforcement existed.
- **Risk:** Blob URLs are ephemeral and valid only in the uploading browser session. Any other employee or admin viewing the record encounters broken links. Furthermore, unvalidated client inputs allow arbitrary string injection into `file_url`.
- **Remediation:** 
  1. Mandate server-side upload processing through a dedicated Server Action or API Route (`/api/documents/upload`).
  2. Upload exclusively to the private Supabase Storage bucket (`travel-documents`).
  3. Store canonical storage object paths (e.g., `trips/{tripId}/employees/{employeeId}/{docType}_{timestamp}.ext`) rather than public or blob URLs.
  4. Generate authenticated, short-lived signed URLs (expiry $\le 3600$ seconds) on demand when viewing files.
- **Rating:** 🔴 Critical (Addressed in Plan)

---

### 🔴 Finding 2: File Size & Type Validation Bypass (CRITICAL - MITIGATED IN DESIGN)
- **Vulnerability:** Relying solely on client-side `<input accept="...">` allows malicious clients or automated tools to upload oversized files (leading to storage exhaustion / Denial of Service) or malicious executables disguised as travel documents.
- **Risk:** Uploading files $\ge 1\text{ MB}$, SVG files containing executable `<script>` payloads (Stored XSS), or polyglot files disguised as images/PDFs.
- **Remediation:**
  1. **Strict File Size Limit:** Enforce `file.size < 1048576` bytes (strictly $< 1\text{ MB}$). Reject any file with byte size $\ge 1\text{ MB}$ on both client and server with explicit 400 error.
  2. **Strict MIME Whitelist:** Restrict strictly to `application/pdf`, `image/jpeg`, `image/png`, and `image/webp`. Disallow `image/svg+xml`, Microsoft Office docs, zip archives, and executables.
  3. **Strict Extension Whitelist:** Verify extension matches MIME type (`.pdf`, `.jpg`, `.jpeg`, `.png`, `.webp`).
  4. **Filename Sanitization:** Strip directory traversal tokens (`../`, `..\`) and replace special characters with alphanumeric slugs before writing to storage.
- **Rating:** 🔴 Critical (Mitigated in Plan)

---

### 🟡 Finding 3: Unauthorized Document Access & Cross-Tenant Data Leakage (MEDIUM)
- **Vulnerability:** Travel documents contain sensitive personal identity records (Passport copies, Visa stamps, Aadhaar/Govt IDs). If storage objects or database rows are publicly accessible or lack tenant boundaries, employees could access peers' confidential documents.
- **Risk:** PII exposure, breach of corporate confidentiality, compliance violation.
- **Remediation:**
  1. The storage bucket `travel-documents` is set to `public: false` (Private).
  2. Database RLS on `public.documents`:
     - Employee can only select/insert/update their own documents (`employee_id = get_current_employee_id()`).
     - Admin can only select/verify documents for employees within their own company tenant (`company_id = get_current_company_id()`).
     - Trip Coordinator can select documents for travelers assigned to their coordinated trip.
  3. Storage object retrieval strictly requires authenticated Supabase session and short-lived signed URL generated through authorized server action.
- **Rating:** 🟡 Medium (Secured)

---

### 🟡 Finding 4: In-App Document Preview Security & Forced Downloads (MEDIUM)
- **Vulnerability:** Opening uploaded files directly in the top-level browser window without proper headers or sandbox attributes could trigger script execution or force unwanted binary downloads.
- **Risk:** Phishing via rogue PDFs or forced download friction violating acceptance criteria.
- **Remediation:**
  1. Implement an in-app viewer modal.
  2. Render images using native `<img>` tags with authenticated signed URLs.
  3. Render PDFs inside `<iframe src="${signedUrl}#toolbar=0" sandbox="allow-scripts allow-same-origin">` to sandbox PDF reader execution while keeping the user inside the application.
  4. Provide explicit "Close Preview" control to return immediately to the previous page.
- **Rating:** 🟡 Medium (Secured)

---

### 🟢 Finding 5: Public Academic PDF Serving & Denial of Service (LOW)
- **Vulnerability:** Academic resources (8 assignments & 10 experiments) must be accessible to students/users without authentication while preventing arbitrary file traversal.
- **Risk:** Path traversal via parameterized filenames (e.g., `../../.env.local`).
- **Remediation:**
  1. Metadata for resources stored in `public.academic_resources` table with hardcoded, deterministic paths (`/home/Assignment/Assignment_{1..8}.pdf` and `/home/Experiment/Experiment_{1..10}.pdf`).
  2. Logical paths validated against an exact regex pattern: `^/home/(Assignment|Experiment)/(Assignment|Experiment)_[0-9]+\.pdf$`.
  3. If physical PDF file is missing, the application renders a friendly empty state component instead of throwing unhandled server exceptions.
- **Rating:** 🟢 Low (Secured)

---

### ✅ Finding 6: Privileged Service Role Key Protection (CLEAN)
- **Status:** Verified. `SUPABASE_SERVICE_ROLE_KEY` is loaded strictly on the server in `lib/supabase/admin.ts`. No client component (`'use client'`) imports or accesses this credential.
- **Rating:** ✅ Clean

---

## 3. Security Requirements Matrix

| Security Control | Required Standard | Implementation Status |
|---|---|---|
| Max File Size | Strictly $< 1\text{ MB}$ (reject $\ge 1\text{ MB}$) | Enforced on both Client UI and Server Action |
| Allowed Types | JPEG, JPG, PNG, WebP, PDF | Whitelisted on Client and Server Action |
| Storage Bucket | Private (`public: false`) | Verified (`travel-documents`) |
| URL Lifetime | Short-lived signed URL ($\le 3600\text{s}$) | Generated on-demand via server action |
| Multi-Tenant RLS | Scoped to `company_id` and `employee_id` | Enforced in PostgreSQL RLS policies |
| Path Traversal | Sanitized storage keys | Regex-checked alphanumeric filenames |
| Service Role Key | Server-only execution | Restricted to `lib/supabase/admin.ts` |
| PDF Viewer | In-app modal with sandbox | Implemented in preview and component specs |
