# SYNTRA Backend API Specification — v1

> **Document Version:** 1.0.0  
> **Target Audience:** Backend Engineers & Full-Stack Developers  
> **API Version Prefix:** `/api/v1`  
> **Frontend Integration:** Configured via `VITE_API_BASE_URL` in the frontend `.env`

---

## 1. Architectural Overview & Conventions

### 1.1 Base URL & Routing
The frontend connects to the backend through a single base URL configured via:
```env
VITE_API_BASE_URL=https://api.yourdomain.com
```
All routes documented below are prefixed by `/api/v1`.

### 1.2 Headers & Content Types
- **Request Content-Type:** `application/json`
- **Response Content-Type:** `application/json`
- **Authentication Header:**
  ```http
  Authorization: Bearer <jwt_or_session_token>
  ```
- **CORS:** The backend must enable CORS for the frontend origin (e.g. `http://localhost:5173` or your production domain), allowing headers: `Content-Type`, `Authorization`.

### 1.3 Unified Error Envelope
All error responses (4xx and 5xx) must return a standardized JSON error envelope:
```json
{
  "error": true,
  "code": "invalid_input",
  "message": "The verification code provided is incorrect or has expired.",
  "request_id": "req_01hgb89xk3m8",
  "generated_at": "2026-10-23T00:00:00Z"
}
```

#### Recognized Error Codes (`code`):
| Code | HTTP Status | Description |
| :--- | :--- | :--- |
| `invalid_input` | 400 / 422 | Input validation failed (malformed email, weak password, invalid code) |
| `unauthorized` | 401 | Missing, invalid, or expired Bearer token |
| `forbidden` | 403 | Authenticated user lacks permissions for this resource |
| `not_found` | 404 | Entity, thread, user, or lab session not found |
| `rate_limited` | 429 | Rate limit exceeded (e.g., OTP resend flood protection) |
| `dependency_unavailable` | 503 | An upstream engine or database is temporarily unreachable |
| `internal_error` | 500 | Unhandled server error |

---

## 2. Authentication & User Identity Endpoints

### 2.1 `POST /api/v1/auth/signup`
Initiates account creation and dispatches a 6-digit verification code to the user's email.

- **Access:** Public
- **Request Body:**
  ```json
  {
    "email": "analyst@security-firm.com",
    "password": "SecurePassword123",
    "name": "Jane Doe"
  }
  ```
- **Password Policy:** Minimum 8 characters, at least 1 uppercase letter, 1 lowercase letter, and 1 digit.
- **Backend Action:**
  1. Validate credentials.
  2. Create an unverified user record (or temporary pending registration).
  3. Hash password using Argon2id or Scrypt.
  4. Generate a cryptographically secure 6-digit OTP code (e.g., `492817`) with a 10-minute expiry (`expires_in_seconds: 600`).
  5. Dispatch OTP via email service (Resend, SendGrid, Amazon SES, or SMTP).
- **Success Response (200 OK or 201 Created):**
  ```json
  {
    "status": "pending_verification",
    "message": "Verification code sent to analyst@security-firm.com",
    "email": "analyst@security-firm.com",
    "expires_in_seconds": 600
  }
  ```
- **Error Responses:**
  - `400 Bad Request` (`invalid_input`): Email format invalid or password too weak.
  - `409 Conflict` (`invalid_input`): An account with this email already exists.

---

### 2.2 `POST /api/v1/auth/verify-otp`
Verifies the 6-digit OTP code, activates the account, and issues authentication tokens.

- **Access:** Public
- **Request Body:**
  ```json
  {
    "email": "analyst@security-firm.com",
    "code": "492817",
    "flow": "signup"
  }
  ```
  *(Allowed `flow` values: `"signup"`, `"login"`, `"reset"`)*
- **Backend Action:**
  1. Check code against stored OTP for this email.
  2. Verify that code is not expired.
  3. Mark user `is_verified = true`.
  4. Invalidate the used OTP.
  5. Issue a signed JWT access token (and optional refresh token).
- **Success Response (200 OK):**
  ```json
  {
    "status": "verified",
    "message": "Identity verified successfully. Welcome to SYNTRA.",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "d7a8e9f0c1b2...",
    "expires_in_seconds": 604800,
    "user": {
      "id": "usr_948a72b",
      "email": "analyst@security-firm.com",
      "name": "Jane Doe",
      "role": "analyst",
      "avatar_url": null,
      "created_at": "2026-10-23T00:15:00Z",
      "is_verified": true
    }
  }
  ```
- **Error Responses:**
  - `400 Bad Request` (`invalid_input`): "Invalid or expired verification code."

---

### 2.3 `POST /api/v1/auth/resend-otp`
Sends a fresh 6-digit verification code to the requested email.

- **Access:** Public (Rate-limited: maximum 3 requests per 5 minutes per email)
- **Request Body:**
  ```json
  {
    "email": "analyst@security-firm.com",
    "flow": "signup"
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "status": "sent",
    "message": "A fresh verification code was sent to analyst@security-firm.com",
    "email": "analyst@security-firm.com",
    "expires_in_seconds": 600
  }
  ```
- **Error Responses:**
  - `429 Too Many Requests` (`rate_limited`): "Please wait 60 seconds before requesting another code."

---

### 2.4 `POST /api/v1/auth/login`
Authenticates existing users with email and password.

- **Access:** Public
- **Request Body:**
  ```json
  {
    "email": "analyst@security-firm.com",
    "password": "SecurePassword123"
  }
  ```
- **Backend Action:**
  1. Verify user exists and verify password hash.
  2. If user is unverified, backend may return a 403 or `{ status: "pending_verification" }` to trigger OTP flow.
  3. Issue access JWT.
- **Success Response (200 OK):**
  ```json
  {
    "status": "authenticated",
    "message": "Signed in successfully",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in_seconds": 604800,
    "user": {
      "id": "usr_948a72b",
      "email": "analyst@security-firm.com",
      "name": "Jane Doe",
      "role": "analyst",
      "is_verified": true
    }
  }
  ```
- **Error Responses:**
  - `401 Unauthorized` (`invalid_input`): "Incorrect email or password."

---

### 2.5 `POST /api/v1/auth/anonymous`
Issues a temporary guest analyst session.

- **Access:** Public
- **Request Body:** `{}`
- **Success Response (200 OK):**
  ```json
  {
    "status": "authenticated",
    "token": "guest_jwt_token_...",
    "expires_in_seconds": 86400,
    "user": {
      "id": "guest_18ab9c",
      "email": null,
      "name": "Guest Analyst",
      "role": "guest",
      "is_verified": true
    }
  }
  ```

---

### 2.6 `GET /api/v1/auth/me`
Fetches the currently authenticated user's profile and validates token freshness.

- **Access:** Authenticated (`Authorization: Bearer <token>`)
- **Success Response (200 OK):**
  ```json
  {
    "user": {
      "id": "usr_948a72b",
      "email": "analyst@security-firm.com",
      "name": "Jane Doe",
      "role": "analyst",
      "avatar_url": null,
      "created_at": "2026-10-23T00:15:00Z",
      "is_verified": true
    }
  }
  ```
- **Error Responses:**
  - `401 Unauthorized` (`unauthorized`): Token expired or invalid.

---

### 2.7 `POST /api/v1/auth/logout`
Revokes the current session / token.

- **Access:** Authenticated (`Authorization: Bearer <token>`)
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Logged out successfully"
  }
  ```

---

## 3. Investigation & Threat Intelligence Endpoints

### 3.1 `GET /api/v1/health`
System readiness and dependency diagnostic endpoint.

- **Access:** Public
- **Success Response (200 OK):**
  ```json
  {
    "status": "ok",
    "dependencies": {
      "retrieval": true,
      "answer_generation": true,
      "lab_orchestration": false
    },
    "retrieval_version": "2026.3.1",
    "generated_at": "2026-10-23T00:20:00Z"
  }
  ```

---

### 3.2 `POST /api/v1/query`
The primary threat intelligence investigation query endpoint.

- **Access:** Authenticated (`Authorization: Bearer <token>`)
- **Request Body:**
  ```json
  {
    "query": "How do attackers establish persistence via scheduled tasks in Windows environments?",
    "mode": "full_report"
  }
  ```
  *(Mode options: `"standard"` or `"full_report"`)*

- **Success Response (200 OK):**
  ```json
  {
    "request_id": "req_84f9a0c2",
    "query": "How do attackers establish persistence via scheduled tasks in Windows environments?",
    "status": "ok",
    "outcome": "ok",
    "answer": "Adversaries frequently leverage the Windows Task Scheduler (MITRE ATT&CK T1053.005) to execute malicious binaries or scripts at system startup or on scheduled intervals...",
    "uncertainty": null,
    "results": [
      {
        "rank": 1,
        "entity": {
          "id": "T1053.005",
          "type": "technique",
          "name": "Scheduled Task",
          "taxonomy": "Enterprise ATT&CK",
          "description": "Adversaries may abuse the Windows Task Scheduler to facilitate initial or recurring execution of malicious code.",
          "description_status": "source_supported"
        },
        "evidence": [
          {
            "evidence_id": "ev_01",
            "ref_id": "T1053.005",
            "status": "confirmed",
            "category": "source",
            "text": "Task Scheduler can be abused using schtasks.exe or the Register-ScheduledTask PowerShell cmdlet to trigger tasks as SYSTEM or high-privilege users.",
            "source_id": "src_mitre_t1053",
            "source_name": "MITRE ATT&CK",
            "source_url": "https://attack.mitre.org/techniques/T1053/005/",
            "source_ref": "ATT&CK v14",
            "evidence_ref": "T1053.005#detection",
            "provenance_type": "standard_corpus"
          }
        ],
        "relationships": [
          {
            "relationship_id": "rel_01",
            "from_id": "T1053.005",
            "relation_type": "subtechnique-of",
            "to_id": "T1053",
            "provenance_type": "mitre_taxonomy"
          }
        ],
        "attack_chain": [
          {
            "technique_id": "T1053.005",
            "technique_name": "Scheduled Task",
            "tactic": "Persistence",
            "status": "confirmed",
            "evidence_ids": ["ev_01"],
            "description": "Task created under \\Microsoft\\Windows\\Maintenance with elevated triggers.",
            "steps": [
              "Identify target persistence path in Task Scheduler registry hive",
              "Execute schtasks /create /tn 'SecurityUpdate' /tr 'c:\\temp\\update.exe' /sc onlogon",
              "Verify execution upon user logon"
            ],
            "lab_available": true
          }
        ],
        "detection": [
          {
            "title": "Process Monitoring for schtasks.exe",
            "description": "Audit Command Line executions containing /create flags and suspicious /tr parameters (Event ID 4688)."
          }
        ],
        "mitigation": [
          {
            "id": "M1047",
            "title": "Audit Tasks and Restrict Access",
            "description": "Configure Group Policy to prevent non-administrative users from scheduling jobs."
          }
        ],
        "missing_evidence": [],
        "summary": "Persistence via Task Scheduler remains a premier technique across commodity and APT groups due to native OS integration.",
        "lab": {
          "lab_id": "lab_t1053_win",
          "technique_id": "T1053.005",
          "technique_name": "Scheduled Task Persistence Lab",
          "available": true,
          "launchable": true,
          "lab_type": "interactive_vm",
          "platform": "windows",
          "runtime_environment": "Isolated Sandbox Hypervisor",
          "network_mode": "airgapped",
          "validation_source": "MITRE Enterprise",
          "objective": "Observe Windows Event Logs when creating persistence tasks",
          "estimated_duration": "15 min",
          "difficulty": "Intermediate",
          "safety_boundary": "Strict sandbox egress filtering",
          "session_steps": [
            "Log in to target Windows Server VM",
            "Run benign schtasks simulation script",
            "Inspect Event Viewer Security log for Event 4698 (A scheduled task was created)"
          ],
          "scenario_objective": "Detect unauthorized task creation"
        }
      }
    ],
    "refusal": null,
    "meta": {
      "retrieval_version": "2026.3.1",
      "generated_at": "2026-10-23T00:20:00Z"
    }
  }
  ```

#### Honest Query Outcome Values (`outcome`):
- `"ok"`: Matching intelligence and evidence retrieved.
- `"no_results"`: Valid cybersecurity query, but no matching entities found.
- `"out_of_domain"`: Query is not related to cybersecurity.
- `"insufficient_evidence"`: Query matches concepts, but evidence does not meet grounding thresholds.
- `"safety_refused"`: Controlled-use safety policy refusal (e.g. asking for automated exploit deployment against live targets). Include `refusal: { "message": "...", "alternatives": [...] }`.

---

### 3.3 `GET /api/v1/entities/:entityId`
Fetches in-depth information, citations, sources, and graph relationships for an entity (e.g., `T1053.005` or `CVE-2024-38077`).

- **Access:** Authenticated
- **Success Response (200 OK):**
  ```json
  {
    "request_id": "req_entity_01",
    "entity": {
      "id": "T1053.005",
      "type": "technique",
      "name": "Scheduled Task",
      "taxonomy": "Enterprise ATT&CK",
      "description": "Adversaries may abuse the Windows Task Scheduler to facilitate execution.",
      "description_status": "source_supported"
    },
    "sources": [
      {
        "source_id": "src_mitre",
        "name": "MITRE ATT&CK",
        "url": "https://attack.mitre.org",
        "kind": "framework"
      }
    ],
    "provenance": [
      {
        "provenance_id": "prov_01",
        "provenance_type": "standard_corpus",
        "source_name": "MITRE ATT&CK",
        "source_ref": "v14.1",
        "source_url": "https://attack.mitre.org/techniques/T1053/005/",
        "version_or_date": "2024-04"
      }
    ],
    "relationships": [
      {
        "relationship_id": "rel_01",
        "from_id": "T1053.005",
        "relation_type": "subtechnique-of",
        "to_id": "T1053",
        "provenance_type": "mitre_taxonomy"
      }
    ],
    "generated_at": "2026-10-23T00:20:00Z"
  }
  ```

---

## 4. History & Conversation Endpoints

### 4.1 `GET /api/v1/history`
Returns previous investigation threads for the logged-in user.

- **Access:** Authenticated (`Authorization: Bearer <token>`)
- **Query Parameters:** `?limit=50&offset=0`
- **Success Response (200 OK):**
  ```json
  {
    "items": [
      {
        "thread_id": "th_84f9a0c2",
        "investigation_id": "inv_01",
        "question": "How do attackers establish persistence via scheduled tasks?",
        "created_at": 1729642800000,
        "preview": "Adversaries frequently leverage the Windows Task Scheduler...",
        "source": "remote"
      }
    ],
    "total": 1,
    "generated_at": "2026-10-23T00:22:00Z"
  }
  ```

---

### 4.2 `DELETE /api/v1/history/:threadId`
Deletes a specific investigation thread from the user's history.

- **Access:** Authenticated
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "deleted_id": "th_84f9a0c2"
  }
  ```

---

## 5. Interactive Sandbox Labs Endpoints

### 5.1 `GET /api/v1/labs`
Returns the catalog of available hands-on threat simulation labs.

- **Access:** Authenticated
- **Success Response (200 OK):**
  ```json
  {
    "labs": [
      {
        "lab_id": "lab_t1053_win",
        "technique_id": "T1053.005",
        "technique_name": "Scheduled Task Persistence Lab",
        "available": true,
        "launchable": true,
        "platform": "windows",
        "validation_source": "MITRE ATT&CK"
      }
    ],
    "generated_at": "2026-10-23T00:25:00Z"
  }
  ```

---

### 5.2 `POST /api/v1/labs/:labId/launch`
Provisions an isolated, audited sandbox session for interactive analysis.

- **Access:** Authenticated
- **Request Body:**
  ```json
  {
    "lab_id": "lab_t1053_win",
    "technique_id": "T1053.005",
    "platform": "windows"
  }
  ```
- **Success Response (200 OK or 202 Accepted):**
  ```json
  {
    "session_id": "sess_9182ab34",
    "lab_id": "lab_t1053_win",
    "technique_id": "T1053.005",
    "status": "ready",
    "connection_url": "wss://sandbox.yourdomain.com/vnc/sess_9182ab34",
    "expires_at": "2026-10-23T01:25:00Z",
    "message": "Sandbox provisioned and ready for analysis."
  }
  ```

---

### 5.3 `GET /api/v1/labs/sessions/:sessionId`
Polls telemetry and status of an active sandbox session.

- **Access:** Authenticated
- **Success Response (200 OK):**
  ```json
  {
    "session_id": "sess_9182ab34",
    "status": "running",
    "uptime_seconds": 320,
    "telemetry": {
      "cpu_percent": 12.4,
      "memory_mb": 2048,
      "network_isolated": true
    },
    "logs": [
      "[00:01:12] Sandbox environment initialized",
      "[00:02:45] PowerShell schtasks command captured in audit buffer"
    ]
  }
  ```

---

### 5.4 `POST /api/v1/labs/sessions/:sessionId/terminate`
Shuts down and deprovisions an active sandbox container / VM.

- **Access:** Authenticated
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "session_id": "sess_9182ab34",
    "terminated_at": "2026-10-23T00:35:00Z"
  }
  ```

---

## 6. Report Export Endpoint

### 6.1 `POST /api/v1/export`
Generates a downloadable briefing document (PDF, Markdown, or JSON) from an investigation turn.

- **Access:** Authenticated
- **Request Body:**
  ```json
  {
    "thread_id": "th_84f9a0c2",
    "format": "pdf",
    "include_provenance": true
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "download_url": "https://storage.yourdomain.com/exports/brief_th_84f9a0c2.pdf?token=...",
    "file_name": "SYNTRA-Brief-T1053-ScheduledTask.pdf",
    "format": "pdf",
    "generated_at": "2026-10-23T00:30:00Z"
  }
  ```

---

## 7. Recommended Backend Stack & Reference Code

The backend can be built with your preferred framework (e.g. Node.js with Fastify or Express, Go, or Python with FastAPI).

### Example Express.js Auth Router with OTP & Resend:
```typescript
import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret";

// In-memory or Redis OTP store: Map<email, { code, expiresAt, passwordHash, name }>
const pendingSignups = new Map();

// 1. Signup -> Send OTP
router.post("/auth/signup", async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || password.length < 8) {
    return res.status(400).json({ error: true, code: "invalid_input", message: "Invalid email or password." });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
  const passwordHash = await bcrypt.hash(password, 12);

  pendingSignups.set(email.toLowerCase(), {
    code,
    passwordHash,
    name,
    expiresAt: Date.now() + 10 * 60 * 1000,
  });

  // Dispatch email with Resend / Nodemailer / SendGrid:
  // await resend.emails.send({ to: email, subject: "Your SYNTRA Code", text: `Your code is ${code}` });

  return res.json({
    status: "pending_verification",
    message: `Verification code sent to ${email}`,
    email,
    expires_in_seconds: 600,
  });
});

// 2. Verify OTP -> Activate & Issue Token
router.post("/auth/verify-otp", async (req, res) => {
  const { email, code } = req.body;
  const pending = pendingSignups.get(email?.toLowerCase());

  if (!pending || pending.code !== code || Date.now() > pending.expiresAt) {
    return res.status(400).json({ error: true, code: "invalid_input", message: "Invalid or expired verification code." });
  }

  // Save user in DB:
  // const user = await db.users.create({ email, passwordHash: pending.passwordHash, name: pending.name, is_verified: true });
  pendingSignups.delete(email.toLowerCase());

  const user = { id: "usr_" + Date.now(), email, name: pending.name, role: "analyst", is_verified: true };
  const token = jwt.sign({ sub: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });

  return res.json({
    status: "verified",
    message: "Identity verified successfully. Welcome to SYNTRA.",
    token,
    expires_in_seconds: 604800,
    user,
  });
});

export default router;
```

---

## 8. Summary of Frontend Environment Variables

Place these in your frontend `.env` when deploying alongside the backend:

```env
# Backend API Base URL (enables real network calls instead of mock)
VITE_API_BASE_URL=https://api.yourdomain.com

# Optional: Welcome Webhook URL for marketing / analytics
VITE_WELCOME_WEBHOOK_URL=
```
