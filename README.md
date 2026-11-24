# HarvestRelay — Surplus Food Redistribution Matcher for Local Eateries

> **Academic Synopsis Implementation**  
> **Aligned with United Nations Sustainable Development Goal 12 (Target 12.3: Responsible Consumption & Production)**

HarvestRelay is a full-stack, location-aware surplus food redistribution platform designed to bridge food businesses (bakeries, restaurants, cafeterias, and delis) with registered non-governmental organizations (NGOs), community kitchens, and volunteer runners. The system ensures edible surplus food is safely discovered, claimed, and collected before its safe-consumption window expires.

---

## 🌟 Key System Capabilities

- **Bespoke, Artisan Civic UI**: Distinctive warm editorial aesthetic with high data density, micro-interactions, responsive mobile/desktop layouts, and zero generic AI templates.
- **Geospatial Discovery (Leaflet + OpenStreetMap + PostGIS)**: Interactive map with custom urgency-coded pins (Available, Urgent, Claimed, User Hub) and real-time Haversine / PostGIS spatial radius filtering (1 km, 3 km, 5 km, 10 km).
- **Controlled Claim & Anti-Conflict Locking**: Concurrency control preventing duplicate claims. When an NGO claims a batch, the status locks across all connected clients in real time.
- **Secure Handover Verification**: A unique 4-digit PIN exchange between food donor and arriving courier verifies safe physical transfer, updating the listing from `CLAIMED` to `COLLECTED` and triggering celebration confetti.
- **Food Safety Compliance & Legal Disclaimers**: Built-in verification checklists for safe temperature maintenance (Room Temp 🍞, Chilled ❄️, Heated 🔥), commercial packaging types, and allergen declarations per Section 2 of the project synopsis.
- **Live Real-Time Synchronization (Socket.IO)**: Connected browsers receive instant live push updates when new batches are posted, claimed, collected, or expired without page reloads.
- **Automated Expiry Monitor**: Background scheduler continuously verifies safe-consumption deadlines, auto-expiring overdue listings.
- **SDG 12 Impact Analytics Hub**: Quantifies total meals saved, kg of food diverted from municipal landfills, and estimated greenhouse gas (CO2e) emissions avoided.

---

## 📐 High-Level System Architecture

```mermaid
flowchart TD
    subgraph Users ["Actors & Roles"]
        Vendor["Food Vendor\n(Bakery, Restaurant, Cafe)"]
        NGO["NGO / Shelter / Volunteer\n(Recipient Couriers)"]
        Admin["Coalition Administrator\n(Monitoring & SDG 12)"]
    end

    subgraph Client ["Frontend Client (React 18 + TypeScript + Tailwind)"]
        Nav["Role Switcher & Navigation"]
        Map["Leaflet + OpenStreetMap View\n(Haversine Distance & Pins)"]
        Cards["Surplus Batch Feed & Ticking Clocks"]
        Modal["Controlled Claim & Handover Modals"]
    end

    subgraph Server ["Backend API & Gateway (Node.js + NestJS)"]
        AuthM["Auth Module & Role Guards (JWT)"]
        ListM["Listings Module (Spatial Filter & CRUD)"]
        ClaimM["Claims Module (Atomic Lock & PIN Handover)"]
        AdminM["Admin Module (SDG 12 Metrics & Audit Logs)"]
        SocketG["Socket.IO Gateway (Real-time Broadcasts)"]
        ExpiryS["Expiry Monitor (Recurring 30s Check)"]
    end

    subgraph Storage ["Dual Database Engine"]
        SQLite[("Embedded SQLite Engine\n(Default Zero-Config)")]
        Postgres[("PostgreSQL + PostGIS\n(Production Spatial Index)")]
    end

    Vendor -->|Post Batch & View PIN| Client
    NGO -->|Geospatial Search & Claim| Client
    Admin -->|Verify Users & Audit Logs| Client

    Client <-->|REST API + JWT Bearer| Server
    Client <-->|WebSockets (Socket.IO)| SocketG

    Server --> SQLite
    Server -.->|DATABASE_URL| Postgres
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** v18+ (tested on Node v22.22.2)
- **npm** v10+

### 1. One-Click Startup (Windows)
Run the included launcher in the project root:
```powershell
.\start-all.ps1
```
*(or double-click `start-all.bat`)*

### 2. Manual Startup

#### Terminal 1 — Backend API & Real-time Socket.IO:
```bash
cd backend
npm install
npm run start:dev
```
Backend runs at: **`http://localhost:3001`**  
*(Pre-seeds 8 realistic eatery profiles, active listings, and claims on first boot!)*

#### Terminal 2 — Frontend Application:
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at: **`http://localhost:5173`**

---

## 🎭 Instant Evaluator Personas (1-Click Demo Switcher)

Use the **"Demo Persona"** dropdown in the top navbar to seamlessly test all roles without needing verification emails:

| Persona | Role | Organization | Special Capabilities |
| :--- | :--- | :--- | :--- |
| **Devansh Tomar** | `VENDOR` | *The Sourdough Loft* (Bakery) | Publish surplus batches, set safe-consumption deadlines, view incoming courier reservations & 4-digit handover PINs. |
| **Kamakshi Singh** | `RECIPIENT` | *Second Harvest Community Kitchen* | Filter nearby batches on Leaflet map, claim batches for redistribution, coordinate transport. |
| **Sagnik Goswami** | `RECIPIENT` | *Student Food Rescue Alliance* | Volunteer runner view, enter 4-digit PIN upon physical arrival to mark food collected. |
| **Hritik** | `ADMIN` | *Central Food Coalition* | Access SDG 12.3 impact dashboard, verify vendor/NGO profiles, inspect real-time audit logs. |

---

## 🛠️ Technology Stack Breakdown

| Layer | Technologies Used | Synopsis Section Reference |
| :--- | :--- | :--- |
| **Frontend UI** | React 18, TypeScript, Tailwind CSS, Lucide Icons, Canvas Confetti | Section 9 (Frontend Stack) |
| **Interactive Maps** | Leaflet 1.9, OpenStreetMap tiles, CartoDB Voyager | Section 9 (Map Integration) |
| **Backend API** | Node.js, NestJS 10, RxJS, TypeScript | Section 8 & 9 (Backend Stack) |
| **Real-Time Push** | Socket.IO (WebSockets) | Section 7 & 9 (Real-time Updates) |
| **Database** | Embedded SQLite (out-of-the-box) & PostgreSQL + PostGIS (`schema.sql`) | Section 9 (PostGIS Queries) |
| **Authentication** | JWT tokens, Bcrypt password hashing, Role-based route guards | Section 7 (Auth & Roles) |

---

## 📡 REST API Reference

### Authentication (`/api/auth`)
- `POST /api/auth/register`: Create a new vendor or recipient account.
- `POST /api/auth/login`: Email and password login.
- `GET  /api/auth/demo-login?role=VENDOR|RECIPIENT|ADMIN`: Instant evaluator single-click authentication.
- `GET  /api/auth/me`: Get current authenticated profile.

### Surplus Listings (`/api/listings`)
- `GET  /api/listings?lat={lat}&lng={lng}&radiusKm={km}&category={cat}&search={q}`: Geospatial search with exact Haversine distance calculations.
- `GET  /api/listings/:id`: Detailed listing record with vendor profile and claim details.
- `POST /api/listings`: Publish a surplus batch (Vendor only).
- `PUT  /api/listings/:id`: Update batch details while status is `AVAILABLE`.
- `POST /api/listings/:id/close`: Cancel or withdraw a listing.

### Claim & Handover (`/api/claims`)
- `POST /api/claims/:listingId`: Atomic claim transaction with conflict rejection (409 Conflict if already claimed).
- `POST /api/claims/:claimId/handover`: Verify 4-digit handover PIN and mark listing as `COLLECTED`.
- `POST /api/claims/:claimId/cancel`: Release a claim back to the community pool.
- `GET  /api/claims/my-claims`: Recipient active pickups and past completed redeliveries.
- `GET  /api/claims/vendor-claims`: Vendor incoming claims and handover statuses.

### Administration & SDG 12 Hub (`/api/admin`)
- `GET   /api/admin/metrics`: Aggregated SDG 12 metrics (portions saved, kg diverted, CO2e avoided).
- `GET   /api/admin/users`: Partner directory with verified badges.
- `PATCH /api/admin/users/:id/verify`: Toggle partner verification status.
- `GET   /api/admin/logs`: Audit trail of all system events.

---

## 🌍 Sustainable Development Goal 12 Metrics Formula

HarvestRelay automatically tracks and displays impact metrics aligned with **UN SDG Target 12.3**:
- **Portion Weight Factor**: 1 meal portion $\approx 0.45\text{ kg}$ of food.
- **Landfill Diversion**: $\text{Food Diverted (kg)} = \text{Total Portions Redistributed} \times 0.45$.
- **Greenhouse Gas Avoidance**: Under UN Food and Agriculture Organization (FAO) research, preventing 1 kg of edible food waste saves approximately $2.5\text{ kg of CO}_2\text{e}$ emissions:
  $$\text{CO}_2\text{e Avoided (kg)} = \text{Food Diverted (kg)} \times 2.5$$

---

## 📄 License & Attribution
Developed as an academic mini-project aligned with the *Surplus Food Redistribution Matcher for Local Eateries* synopsis. Map data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors.

