# Diagram 12 — Database Flow

Simple story of how data moves (for non-technical training).  
This is **not** a full technical database schema — see the [Architecture Report](../SYSTEM_ARCHITECTURE.md) for that.

---

```mermaid
%%{init: {'theme':'base', 'themeVariables': { 'fontFamily':'arial', 'primaryColor':'#E8F5E9', 'primaryTextColor':'#1B5E20', 'primaryBorderColor':'#2E7D32', 'lineColor':'#607D8B'}}}%%
flowchart TB
  A([Farmer]) --> B[Products / harvest records]
  B --> C[Inventory<br/>Youth Huza stock]
  C --> D[Website<br/>HUZA FRESH catalog]
  D --> E([Customer])
  E --> F[Orders]
  F --> G[Payments]
  G --> H[Reports<br/>for Youth Huza]

  classDef start fill:#1B5E20,color:#FFFFFF,stroke:#1B5E20
  classDef box fill:#FFFFFF,color:#263238,stroke:#90A4AE
  classDef endn fill:#546E7A,color:#FFFFFF,stroke:#546E7A

  class A,E start
  class B,C,D,F,G,H box
```

---

## Remember

Every arrow above is handled inside the same Youth Huza system — farmers do not upload directly to a separate shop database.
