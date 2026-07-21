# Diagram 9 — Inventory

How stock moves from receipt to customer sales.

---

```mermaid
%%{init: {'theme':'base', 'themeVariables': { 'fontFamily':'arial', 'primaryColor':'#E8F5E9', 'primaryTextColor':'#1B5E20', 'primaryBorderColor':'#2E7D32', 'lineColor':'#607D8B'}}}%%
flowchart TB
  A([Products received<br/>From farmer PO or market buy]) --> B[Inspection / goods receipt]
  B --> C[Storage<br/>Warehouse locations & batches]
  C --> D[Inventory update<br/>Stock quantity on product]

  D --> E[Listed on website when published]
  E --> F[Customer places order]
  F --> G[Stock reserved]
  G --> H[Payment confirmed]
  H --> I[Stock reduced<br/>Sale committed]

  I --> J{Low stock?}
  J -->|Yes| K[Restock alert / request]
  J -->|No| L([Continue selling])
  K --> L

  classDef start fill:#1B5E20,color:#FFFFFF,stroke:#1B5E20
  classDef box fill:#FFFFFF,color:#263238,stroke:#90A4AE
  classDef choice fill:#E8F5E9,color:#1B5E20,stroke:#2E7D32
  classDef endn fill:#546E7A,color:#FFFFFF,stroke:#546E7A

  class A,L start
  class B,C,D,E,F,G,H,I,K box
  class J choice
```

---

## Notes for trainers

- Staff use **Admin → Inventory** and the **Warehouse** tools for receiving and adjustments.
- Customers may request restock interest on out-of-stock products; staff see those requests in Admin.
