# Diagram 8 — Procurement

How Youth Huza turns accepted harvest into inventory and website products.

---

```mermaid
%%{init: {'theme':'base', 'themeVariables': { 'fontFamily':'arial', 'primaryColor':'#E8F5E9', 'primaryTextColor':'#1B5E20', 'primaryBorderColor':'#2E7D32', 'lineColor':'#607D8B'}}}%%
flowchart TB
  A([Produce available<br/>From farmer submit or offer]) --> B[Farm / goods inspection]
  B --> C[Quality assessment]
  C --> D[Grade assignment<br/>Grade 1 · 2 · 3]

  D --> E{Commercial path}
  E -->|Outright buy| F[Youth Huza purchases<br/>Full payment to farmer]
  E -->|Commission / partnership| G[Youth Huza sells for farmer<br/>Commission then farmer payout]
  E -->|Market buy| H[Buy from open market<br/>When needed]

  F --> I[Receive into inventory]
  G --> I
  H --> I

  I --> J[Official product photos<br/>Photography / storefront]
  J --> K[Publish on HUZA FRESH]
  K --> L([Customers can buy])

  classDef start fill:#1B5E20,color:#FFFFFF,stroke:#1B5E20
  classDef box fill:#FFFFFF,color:#263238,stroke:#90A4AE
  classDef choice fill:#E8F5E9,color:#1B5E20,stroke:#2E7D32
  classDef endn fill:#546E7A,color:#FFFFFF,stroke:#546E7A

  class A,L start
  class B,C,D,F,G,H,I,J,K box
  class E choice
```

---

## Notes for trainers

- Procurement tools live under **Admin → Procurement** (and related farmer / photography screens).
- Market purchase is used when Huza buys outside a registered farmer offer.
- Farmer sees buy orders and payments in **Sales** on the Farmers Portal.
