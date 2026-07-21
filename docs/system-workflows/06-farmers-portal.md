# Diagram 6 — Farmers Portal (HUZA GROW)

Complete farmer journey from first visit to selling and getting paid.

---

```mermaid
%%{init: {'theme':'base', 'themeVariables': { 'fontFamily':'arial', 'primaryColor':'#E8F5E9', 'primaryTextColor':'#1B5E20', 'primaryBorderColor':'#2E7D32', 'lineColor':'#607D8B'}}}%%
flowchart TB
  A([Farmer opens Farmers Portal]) --> B[Home / landing page<br/>Learn about partnership]
  B --> C[Register]
  C --> D[Fill farm details<br/>Full farm dossier]
  D --> E[Submit application]

  E --> F[Admin reviews application]
  F --> G{Visit needed?}
  G -->|Yes| H[Farm visit by Youth Huza team]
  G -->|No / after visit| I[Approval decision]
  H --> I

  I -->|Approved| J[Farmer can use full selling tools]
  I -->|Not yet / rejected| K[Waiting or update details in Account<br/>Then wait for Huza again]

  J --> L[Farmer dashboard]
  L --> M[Sell produce<br/>Submit harvest]
  L --> N[My crops & farm profile]
  L --> O[Agronomy & training]
  M --> P[Track sales<br/>Purchase orders]
  P --> Q[Payments from Youth Huza]
  Q --> R([Ongoing partnership])

  K --> L2[Limited access while pending<br/>Training & account still available]
  L2 --> F

  classDef start fill:#1B5E20,color:#FFFFFF,stroke:#1B5E20
  classDef box fill:#FFFFFF,color:#263238,stroke:#90A4AE
  classDef choice fill:#E8F5E9,color:#1B5E20,stroke:#2E7D32
  classDef wait fill:#FFF8E1,color:#F57F17,stroke:#FBC02D
  classDef endn fill:#546E7A,color:#FFFFFF,stroke:#546E7A

  class A,R start
  class B,C,D,E,F,H,I,J,L,M,N,O,P,Q box
  class G choice
  class K,L2 wait
```

---

## Notes for trainers

- New farmers register on the **conventional partner** path (standard farming). Organic fields may exist for older accounts.
- Login uses **phone + last 4 digits of National ID**.
- Selling (submit harvest, sales, reports) unlocks after the farm account is **Approved**.
