# TripBoard System Architecture & System Flowchart

This document provides balanced, report-ready Mermaid diagrams for the TripBoard project.

---

## 1. System Architecture (4-Tier Model)

```mermaid
flowchart TD
    %% Tiers
    subgraph Client["1. Client Layer (Browser)"]
        AdminPortal["Admin Portal (Workspace & Management)"]
        EmpPortal["Employee & Coordinator Portal (Trips & Vault)"]
    end

    subgraph AppServer["2. Application Server (Next.js 15)"]
        ServerAction["Next.js App Router & Server Actions"]
        Validation["Zod Validation & Regional Standards (DD/MM/YYYY, INR, +91)"]
    end

    subgraph BackendServices["3. Backend Services (Supabase)"]
        AuthService["Supabase Auth (JWT & Email OTP)"]
        StorageService["Supabase Storage (travel-documents bucket)"]
    end

    subgraph Database["4. Database Layer (PostgreSQL)"]
        PostgresDB[("PostgreSQL Database with Row Level Security (RLS)")]
    end

    %% Connections
    AdminPortal --> ServerAction
    EmpPortal --> ServerAction
    ServerAction --> Validation
    Validation --> AuthService
    Validation --> StorageService
    Validation --> PostgresDB
```

---

## 2. System Flowchart (Compact Landscape Layout - Fits on 1 Page)

A clean, 16:9 landscape diagram structured across 4 key stages with vertically stacked operational lanes, designed specifically to fit on a single report page without vertical stretching.

```mermaid
flowchart LR
    Start(["1. Start / Access\nEmail OTP & Role Check"])

    %% Stacked Parallel Lanes
    Start -->|Admin| AdminTrack["2A. Admin Trip Planning\n• Setup Workspace & Employees\n• Create Trip & Budget (INR)\n• Choose Document Checklist\n• Assign Staff & Coordinator"]
    Start -->|Employee| EmpTrack["2B. Employee Travel Vault\n• View Assigned Trip Details\n• Check Required Documents\n• Upload Files (<1MB, PDF/Image)\n• Track Real-time Status"]

    %% Convergence
    AdminTrack --> Review["3. Coordinator Verification\n• Inspect Uploaded Documents\n• Approve or Request Re-upload"]
    EmpTrack --> Review

    Review -->|Rejected| EmpTrack
    Review -->|Approved| Done(["4. Departure & Clearance\n• Trip Status: Ready for Travel\n• Trip Commences & Concludes\n• Archive Records"])
```
