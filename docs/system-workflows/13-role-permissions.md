# Diagram 13 — Role Permissions

Who can use which parts of the platform.

---

```mermaid
%%{init: {'theme':'base', 'themeVariables': { 'fontFamily':'arial', 'primaryColor':'#E8F5E9', 'primaryTextColor':'#1B5E20', 'primaryBorderColor':'#2E7D32', 'lineColor':'#607D8B'}}}%%
flowchart TB
  subgraph CUST["Customer"]
    C1[Shop & cart]
    C2[Checkout & pay]
    C3[Account & track orders]
    C4[Support chat]
  end

  subgraph FARM["Farmer"]
    F1[Register & farm profile]
    F2[Dashboard after approval]
    F3[Sell produce · crops]
    F4[Sales & payments view]
    F5[Agronomy & training]
  end

  subgraph EMP["Huza Employee"]
    E1[Assigned Admin modules only]
    E2[Examples: Orders · Inventory · Support · Procurement · Finance · Delivery]
    E3[Cannot manage system settings or staff accounts]
  end

  subgraph ADM["Administrator / Manager"]
    A1[Most Admin operations]
    A2[Orders · catalog · farmers · procurement · payments]
    A3[No Super Admin–only system pages]
  end

  subgraph SA["Super Administrator"]
    S1[Everything Administrators can do]
    S2[Staff accounts]
    S3[System settings · hours · security · audit]
  end

  classDef cust fill:#E3F2FD,color:#0D47A1,stroke:#1976D2
  classDef farm fill:#E8F5E9,color:#1B5E20,stroke:#2E7D32
  classDef emp fill:#FFF8E1,color:#F57F17,stroke:#FBC02D
  classDef adm fill:#F3E5F5,color:#6A1B9A,stroke:#8E24AA
  classDef sa fill:#1B5E20,color:#FFFFFF,stroke:#1B5E20

  class C1,C2,C3,C4 cust
  class F1,F2,F3,F4,F5 farm
  class E1,E2,E3 emp
  class A1,A2,A3 adm
  class S1,S2,S3 sa
```

---

## Quick matrix

| Area | Customer | Farmer | Huza Employee | Administrator | Super Admin |
|------|:--------:|:------:|:-------------:|:-------------:|:-----------:|
| HUZA FRESH shop | Yes | — | — | — | — |
| Farmers Portal workspace | — | Yes | — | —* | —* |
| Admin orders / catalog | — | — | If assigned | Yes | Yes |
| Procurement | — | View own sales | If assigned | Yes | Yes |
| Staff & system settings | — | — | No | No | Yes |
| Delivery portal | — | — | Delivery role | Yes | Yes |

\*Staff may open farmer tools only in special cases (e.g. linked test profiles); day-to-day farmers use `/farmer`.

Employee job titles in the system include: Manager, Procurement, Finance, Inventory, Warehouse, Support, Delivery — each with a different module list.
