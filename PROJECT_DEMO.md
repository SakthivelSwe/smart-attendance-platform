# 🎯 Smart Attendance Automation Platform - Complete Demo Guide

> **Live URLs**
> - 🌐 **Frontend**: [https://smart-attendance-automation.netlify.app](https://smart-attendance-automation.netlify.app)
> - ⚙️ **Backend API**: [https://smart-attendance-platform-production.up.railway.app](https://smart-attendance-platform-production.up.railway.app)

---

## 📐 Architecture Overview

```mermaid
graph LR
    A[👤 Admin] -->|Login| B[Angular Frontend<br/>Netlify]
    B -->|REST API| C[Spring Boot Backend<br/>Railway]
    C -->|CRUD| D[(PostgreSQL<br/>Supabase)]
    C -->|OAuth2| E[Google Auth]
    C -->|Email| F[Gmail API]
    
    style B fill:#4F46E5,color:#fff
    style C fill:#059669,color:#fff
    style D fill:#2563EB,color:#fff
```

---

## 🔄 How the Attendance Model Works

```mermaid
flowchart TD
    A[📱 WhatsApp Group] -->|1. Employees send messages<br/>WFO / WFH / Leave| B[WhatsApp Chat]
    B -->|2. Admin exports chat<br/>Export Chat → Without Media| C[📋 Chat Text File]
    C -->|3. Paste in Platform<br/>Attendance → Process| D[🖥️ Smart Attend Platform]
    D -->|4. Auto-Parse Messages<br/>Match names → Set status| E[📊 Attendance Records]
    E -->|5. Generate Reports| F[📈 Monthly Summary]
    
    style A fill:#25D366,color:#fff
    style D fill:#4F46E5,color:#fff
    style E fill:#059669,color:#fff
    style F fill:#D97706,color:#fff
```

---

## 🗺️ App Navigation Map

```
┌──────────────────────────────────────────────────┐
│  SmartAttend                                      │
├──────────┬───────────────────────────────────────┤
│          │                                        │
│ SIDEBAR  │         MAIN CONTENT AREA              │
│          │                                        │
│ 📊 Dashboard  │  ← Stats + Charts               │
│ 📋 Attendance │  ← Daily records + Process Chat  │
│ 👥 Employees  │  ← Add/Edit employees            │
│ 🏢 Groups     │  ← WhatsApp group config         │
│ 🏖️ Leaves     │  ← Leave requests                │
│ 📅 Holidays   │  ← Holiday calendar              │
│ 📈 Summary    │  ← Monthly reports               │
│ ⚙️ Settings   │  ← Theme + Account               │
│          │                                        │
└──────────┴───────────────────────────────────────┘
```

---

## 🚀 Step-by-Step Demo

---

### ① Login with Google OAuth

```
Navigate to: https://smart-attendance-automation.netlify.app
```

```
┌─────────────────────────────────────┐
│                                     │
│         ┌──────────┐                │
│         │ 📋 ✓     │  ← Logo       │
│         └──────────┘                │
│                                     │
│         SmartAttend                  │
│   Automated Attendance Management   │
│                                     │
│   ✅ WhatsApp-based tracking        │
│   📊 Monthly reports & analytics    │
│   📧 Email notifications            │
│                                     │
│   ┌─────────────────────────┐       │
│   │ 🔵 Sign in with Google  │       │
│   └─────────────────────────┘       │
│                                     │
└─────────────────────────────────────┘
```

- Click **"Sign in with Google"**
- Select `sakthiveltony@gmail.com` → You get **ADMIN** role
- Redirected to **Dashboard**

---

### ② Dashboard Overview

```
Navigate: Sidebar → 📊 Dashboard
```

```
┌────────────────────────────────────────────────────┐
│  📊 Dashboard                                       │
├────────────┬───────────┬───────────┬───────────────┤
│ Total      │ Present   │ On Leave  │ Attendance    │
│ Employees  │ Today     │ Today     │ Rate          │
│    25      │    22     │     2     │    92%        │
├────────────┴───────────┴───────────┴───────────────┤
│                                                     │
│  📊 Weekly Attendance Chart                         │
│  ██████████████████ Mon: 24                         │
│  █████████████████  Tue: 23                         │
│  ████████████████   Wed: 22                         │
│  ██████████████████ Thu: 24                         │
│  ███████████████    Fri: 21                         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

Shows real-time stats: employee counts, attendance rate, and bar chart.

---

### ③ Add a Group (WhatsApp Group Configuration)

```
Navigate: Sidebar → 🏢 Groups → Click "+ Add Group" button
```

```mermaid
sequenceDiagram
    participant Admin
    participant Platform
    participant Database

    Admin->>Platform: Click "+ Add Group"
    Note over Platform: Modal opens
    Admin->>Platform: Fill form:<br/>Name: "Engineering Team"<br/>WhatsApp Group: "Eng Attendance"<br/>Email Pattern: "WhatsApp Chat*"
    Admin->>Platform: Click "Create"
    Platform->>Database: Save group
    Database-->>Platform: Group saved
    Platform-->>Admin: Group card appears
```

**Form Fields:**

| Field | Example | Purpose |
|-------|---------|---------|
| **Name** *(required)* | `Engineering Team` | Display name |
| **WhatsApp Group Name** | `Eng Team Attendance` | Exact name in WhatsApp |
| **Email Subject Pattern** | `WhatsApp Chat*` | For email auto-processing |
| **Google Sheet ID** | *(optional)* | Google Sheets export |

**Result: Group Card**
```
┌─────────────────────────────┐
│  🟢 E  Engineering Team     │
│        5 employees    Active │
│                              │
│  💬 Eng Team Attendance      │
│  📧 WhatsApp Chat*           │
│                              │
│  [ Edit ]    [ Delete ]      │
└──────────────────────────────┘
```

---

### ④ Add Employees

```
Navigate: Sidebar → 👥 Employees → Click "+ Add Employee" button
```

**Form Fields:**

| Field | Example | Why It Matters |
|-------|---------|----------------|
| **Name** | `John Doe` | Display name |
| **Employee Code** | `EMP001` | Unique ID |
| **Email** | `john@company.com` | Notifications |
| **Phone** | `+91 98765 43210` | Contact |
| **Group** | `Engineering Team` | Assignment |
| **WhatsApp Name** | `John Doe` | ⚠️ **Must match WhatsApp display name exactly!** |

> ⚠️ **Critical**: The **WhatsApp Name** field must **exactly match** the employee's display name in the WhatsApp group. Otherwise, the attendance parser won't match their messages.

---

### ⑤ Export WhatsApp Group Chat & Process Attendance

This is the **core feature** of the entire platform.

#### Step A: Export Chat from WhatsApp

```mermaid
flowchart LR
    A[📱 Open WhatsApp] --> B[Open Attendance Group]
    B --> C[Tap Group Name]
    C --> D[⋮ More Options]
    D --> E[Export Chat]
    E --> F[Without Media]
    F --> G[📋 Copy Text]
    
    style G fill:#059669,color:#fff
```

**Exported chat text looks like:**
```
17/02/2026, 09:00 - Alice Johnson: Good morning! WFO
17/02/2026, 09:05 - Bob Smith: WFH today
17/02/2026, 09:10 - Charlie Brown: On leave - fever
17/02/2026, 09:15 - Diana Prince: WFO
17/02/2026, 09:20 - Eve Wilson: WFH
17/02/2026, 17:30 - Alice Johnson: Out for the day
17/02/2026, 18:00 - Diana Prince: Out
```

#### Step B: Paste & Process in Platform

```
Navigate: Sidebar → 📋 Attendance → Click "Process" button (top-right)
```

```
┌─────────────────────────────────────────┐
│  Process WhatsApp Chat                   │
│                                          │
│  Date: [ 2026-02-17        📅 ]         │
│                                          │
│  Chat Text:                              │
│  ┌─────────────────────────────────────┐ │
│  │ 17/02/2026, 09:00 - Alice: WFO     │ │
│  │ 17/02/2026, 09:05 - Bob: WFH       │ │
│  │ 17/02/2026, 09:10 - Charlie: Leave │ │
│  │ 17/02/2026, 09:15 - Diana: WFO     │ │
│  │ 17/02/2026, 17:30 - Alice: Out     │ │
│  │ 17/02/2026, 18:00 - Diana: Out     │ │
│  └─────────────────────────────────────┘ │
│                                          │
│              [ Cancel ]  [ Process ]     │
└──────────────────────────────────────────┘
```

#### Step C: View Results

After processing, the attendance table auto-populates:

```
┌──────────────┬──────────┬─────────┬──────────┬─────────┬──────────┐
│ Employee     │ Code     │ In Time │ Out Time │ Status  │ Source   │
├──────────────┼──────────┼─────────┼──────────┼─────────┼──────────┤
│ Alice Johnson│ EMP001   │ 09:00   │ 17:30    │ 🟢 WFO  │ WHATSAPP │
│ Bob Smith    │ EMP002   │ 09:05   │ —        │ 🔵 WFH  │ WHATSAPP │
│ Charlie Brown│ EMP003   │ 09:10   │ —        │ 🟡 LEAVE│ WHATSAPP │
│ Diana Prince │ EMP004   │ 09:15   │ 18:00    │ 🟢 WFO  │ WHATSAPP │
│ Eve Wilson   │ EMP005   │ 09:20   │ —        │ 🔵 WFH  │ WHATSAPP │
│ Frank Miller │ EMP006   │ —       │ —        │ 🔴 ABSENT│ SYSTEM  │
└──────────────┴──────────┴─────────┴──────────┴─────────┴──────────┘
```

**Filter tabs:** `All (6)` | `WFO (2)` | `WFH (2)` | `Leave (1)` | `Absent (1)`

**Supported Keywords:**

| Message Keyword | Attendance Status |
|----------------|-------------------|
| `WFO` | 🟢 Work From Office |
| `WFH` | 🔵 Work From Home |
| `Leave`, `CL`, `SL`, `PL` | 🟡 Leave |
| `Out`, `leaving` | Sets out-time |

---

### ⑥ Email Integration

```
Navigate: Sidebar → 🏢 Groups → Set "Email Subject Pattern"
```

```mermaid
flowchart TD
    A[📧 Employee emails<br/>WhatsApp chat export] -->|Gmail receives email| B[Gmail Inbox]
    B -->|Backend scans for<br/>matching subject pattern| C[Spring Boot Backend]
    C -->|Parse attachment| D[Extract chat text]
    D -->|Process attendance| E[📊 Attendance Records]
    
    style C fill:#059669,color:#fff
```

**How it works:**
1. Configure **Email Subject Pattern** in Group settings (e.g., `"WhatsApp Chat*"`)
2. When someone emails the exported WhatsApp chat, Gmail receives it
3. Backend periodically scans Gmail for emails matching the pattern
4. Automatically extracts and processes the chat text
5. Attendance records are created without any manual intervention

> **Required Railway Environment Variables:**
> `MAIL_HOST`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `GMAIL_CREDENTIALS_PATH`

---

### ⑦ Leave Management

```
Navigate: Sidebar → 🏖️ Leaves
```

```mermaid
sequenceDiagram
    participant Employee
    participant Platform
    participant Admin

    Employee->>Platform: Apply Leave<br/>(type, dates, reason)
    Platform->>Admin: Show pending request
    Admin->>Platform: Approve ✅ / Reject ❌
    Platform->>Employee: Notification sent
    Note over Platform: Approved leaves auto-mark<br/>as LEAVE in attendance
```

**Admin can:**
- View all pending leave requests
- **Approve** with remarks
- **Reject** with reason
- Approved leaves automatically update attendance records

---

### ⑧ Holiday Management

```
Navigate: Sidebar → 📅 Holidays → Click "+ Add Holiday"
```

| Field | Example |
|-------|---------|
| **Name** | `Republic Day` |
| **Date** | `2026-01-26` |

On holiday dates, **all employees** are automatically marked as `HOLIDAY` — no action needed.

---

### ⑨ Monthly Summary & Reports

```
Navigate: Sidebar → 📈 Summary → Select Month/Year → Click "Generate"
```

```
┌──────────────┬──────────┬─────┬─────┬───────┬────────┬────────────┐
│ Employee     │ Working  │ WFO │ WFH │ Leave │ Absent │ Attendance │
│              │ Days     │     │     │       │        │ Rate       │
├──────────────┼──────────┼─────┼─────┼───────┼────────┼────────────┤
│ Alice Johnson│ 22       │ 18  │ 3   │ 1     │ 0      │ 100%       │
│ Bob Smith    │ 22       │ 5   │ 15  │ 1     │ 1      │ 95.5%      │
│ Charlie Brown│ 22       │ 16  │ 2   │ 3     │ 1      │ 95.5%      │
│ Diana Prince │ 22       │ 20  │ 1   │ 1     │ 0      │ 100%       │
└──────────────┴──────────┴─────┴─────┴───────┴────────┴────────────┘
```

---

### ⑩ Settings

```
Navigate: Sidebar → ⚙️ Settings
```

- **🌙 Dark Mode**: Toggle between light and dark themes
- **👤 Account**: View your name, email, role (ADMIN/USER), and avatar
- **ℹ️ About**: App version and tech stack info
- **🚪 Sign Out**: Logout button

---

## 🔐 Role-Based Access Control

| Feature | 👑 ADMIN | 👤 USER |
|---------|----------|---------|
| View Dashboard | ✅ | ✅ |
| View Attendance | ✅ | ✅ |
| **Process WhatsApp Chat** | ✅ | ❌ |
| **Add/Edit Employees** | ✅ | ❌ |
| **Add/Edit Groups** | ✅ | ❌ |
| **Manage Holidays** | ✅ | ❌ |
| **Approve/Reject Leaves** | ✅ | ❌ |
| **Generate Summary** | ✅ | ❌ |
| View Settings | ✅ | ✅ |

---

## 🏗️ Tech Stack

```mermaid
graph TB
    subgraph Frontend
        A[Angular 17] --> B[TailwindCSS 3]
        A --> C[Google Identity Services]
    end
    
    subgraph Backend
        D[Spring Boot 3.2] --> E[Spring Security + JWT]
        D --> F[Spring Data JPA]
        D --> G[Gmail API]
    end
    
    subgraph Infrastructure
        H[Netlify] --> A
        I[Railway] --> D
        J[(Supabase PostgreSQL)] --> F
        K[GitHub Actions CI] --> A
        K --> D
    end
    
    A -->|REST API| D
    
    style A fill:#DD0031,color:#fff
    style D fill:#6DB33F,color:#fff
    style J fill:#3ECF8E,color:#fff
    style H fill:#00C7B7,color:#fff
    style I fill:#7B00FF,color:#fff
```

---

## 📱 WhatsApp Chat Format Reference

The platform expects the standard WhatsApp export format:

```
DD/MM/YYYY, HH:MM - DisplayName: Message
```

### Example
```
17/02/2026, 09:00 - Alice: Good morning! WFO
17/02/2026, 09:05 - Bob: WFH today
17/02/2026, 09:10 - Charlie: On leave - fever
17/02/2026, 09:15 - Diana: WFO
17/02/2026, 17:30 - Alice: Out for the day
17/02/2026, 18:00 - Diana: Out
```

---

*Built with ❤️ using Angular 17, Spring Boot 3.2, PostgreSQL (Supabase), deployed on Netlify + Railway*
