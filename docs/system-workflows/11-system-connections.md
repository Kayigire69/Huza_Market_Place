# Diagram 11 — System Connections

Master view: how every major part of Youth Huza connects.

---

```mermaid
%%{init: {'theme':'base', 'themeVariables': { 'fontFamily':'arial', 'primaryColor':'#E8F5E9', 'primaryTextColor':'#1B5E20', 'primaryBorderColor':'#2E7D32', 'lineColor':'#607D8B'}}}%%
flowchart TB
  ENTRY[Public Entry Page] --> FRESH[Customer Website<br/>HUZA FRESH]
  ENTRY --> GROW[Farmers Portal<br/>HUZA GROW]

  FRESH --> DB[(Shared database)]
  GROW --> DB
  ADMIN[Admin Portal] --> DB

  GROW -->|Farm applications & harvest| ADMIN
  FRESH -->|Customer orders & payments| ADMIN

  ADMIN --> PROC[Procurement]
  ADMIN --> INV[Inventory]
  ADMIN --> ORD[Customer order handling]
  ADMIN --> REP[Reports]

  PROC --> INV
  INV -->|Published products| FRESH
  ORD -->|Pickup / delivery| FRESH
  PROC -->|Farmer buy orders & payouts| GROW
  REP --> ADMIN

  classDef portal fill:#1B5E20,color:#FFFFFF,stroke:#1B5E20
  classDef box fill:#FFFFFF,color:#263238,stroke:#90A4AE
  classDef db fill:#ECEFF1,color:#263238,stroke:#546E7A
  classDef ops fill:#E8F5E9,color:#1B5E20,stroke:#2E7D32

  class ENTRY,FRESH,GROW,ADMIN portal
  class PROC,INV,ORD,REP ops
  class DB db
```

---

## Data flow in one sentence

Farmers and customers use their portals; **Admin** runs procurement, inventory, and orders; everything is stored in one **database**; approved products return to the **customer website**.
