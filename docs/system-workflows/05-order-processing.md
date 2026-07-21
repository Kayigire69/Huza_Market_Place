# Diagram 5 — Order Processing

From customer order to completion (ops view).

---

```mermaid
%%{init: {'theme':'base', 'themeVariables': { 'fontFamily':'arial', 'primaryColor':'#E8F5E9', 'primaryTextColor':'#1B5E20', 'primaryBorderColor':'#2E7D32', 'lineColor':'#607D8B'}}}%%
flowchart TB
  A([Customer places order<br/>& pays / sends Mobile Money]) --> B[Admin receives order]
  B --> C[Verify payment<br/>Finance or Admin confirms when needed]
  C --> D[Verify stock<br/>Reserved quantity checked]
  D --> E[Prepare products<br/>Pack order]

  E --> F{Customer chose?}
  F -->|Pickup| G[Mark ready for pickup<br/>Notify customer]
  F -->|Home delivery| H[Mark ready for dispatch<br/>Assign delivery]

  G --> I[Customer collects order]
  H --> J[Out for delivery]
  J --> K[Customer receives products]

  I --> L([Order completed])
  K --> L

  classDef start fill:#1B5E20,color:#FFFFFF,stroke:#1B5E20
  classDef box fill:#FFFFFF,color:#263238,stroke:#90A4AE
  classDef choice fill:#E8F5E9,color:#1B5E20,stroke:#2E7D32
  classDef endn fill:#546E7A,color:#FFFFFF,stroke:#546E7A

  class A,L start
  class B,C,D,E,G,H,I,J,K box
  class F choice
```

---

## Status path (simple)

Pending → Paid / Confirmed → Preparing → Packed → Ready for pickup **or** Ready for dispatch → Out for delivery → Delivered
