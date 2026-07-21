# Diagram 7 — Produce Submission

How a farmer submits harvest for Youth Huza to review (direct sell path).

---

```mermaid
%%{init: {'theme':'base', 'themeVariables': { 'fontFamily':'arial', 'primaryColor':'#E8F5E9', 'primaryTextColor':'#1B5E20', 'primaryBorderColor':'#2E7D32', 'lineColor':'#607D8B'}}}%%
flowchart TB
  A([Approved farmer]) --> B[Open Sell / My Produce]
  B --> C[Submit harvest]
  C --> D[Crop & quality information<br/>Photos, quantity, unit]
  D --> E[Expected harvest / harvest details<br/>From crop record when linked]
  E --> F[Submit for review]

  F --> G[Admin notification<br/>Product in Approvals queue]
  G --> H[Admin quality review<br/>Inspection photos & notes]

  H --> I{Decision}
  I -->|Needs farm check| J[Farm visit / follow-up]
  J --> I
  I -->|Accepted| K[Grade assigned<br/>Official shop photos added]
  I -->|Rejected| L[Farmer sees feedback<br/>Can improve & resubmit]

  K --> M[Available for purchase path<br/>See Procurement & Inventory]
  M --> N([May appear on HUZA FRESH<br/>after publish])

  classDef start fill:#1B5E20,color:#FFFFFF,stroke:#1B5E20
  classDef box fill:#FFFFFF,color:#263238,stroke:#90A4AE
  classDef choice fill:#E8F5E9,color:#1B5E20,stroke:#2E7D32
  classDef endn fill:#546E7A,color:#FFFFFF,stroke:#546E7A

  class A,N start
  class B,C,D,E,F,G,H,J,K,L,M box
  class I choice
```

---

## Notes for trainers

- Farmers do **not** set the final shop price alone; Youth Huza inspects and agrees commercial terms.
- Deal type (direct buy vs commission) is set by Huza operations on the purchase order—not chosen as two separate buttons by the farmer.
- Related flow: [Procurement](./08-procurement.md).
