# Diagram 2 — Customer Website (HUZA FRESH)

Complete customer shopping journey, as implemented today.

**Portal:** Customer Website · Payment: Mobile Money to Youth Huza (often confirmed by staff when live bank APIs are not connected)

---

```mermaid
%%{init: {'theme':'base', 'themeVariables': { 'fontFamily':'arial', 'primaryColor':'#E8F5E9', 'primaryTextColor':'#1B5E20', 'primaryBorderColor':'#2E7D32', 'lineColor':'#607D8B'}}}%%
flowchart TB
  A([Customer arrives on HUZA FRESH]) --> B[Home / shop landing]
  B --> C[Browse categories]
  B --> D[Search products]
  C --> E[View product details]
  D --> E
  E --> F[Add to cart]
  F --> G[Shopping cart]
  G --> H[Checkout]

  H --> I{Fulfillment choice}
  I -->|Pickup| J[Pickup at Youth Huza<br/>No delivery fee]
  I -->|Home delivery| K[Enter address & zone<br/>Delivery fee agreed by phone]

  J --> L[Pay with Mobile Money<br/>MTN or Airtel · paid to Youth Huza]
  K --> L

  L --> M[Order confirmation]
  M --> N[Admin receives the order]
  N --> O[Order processing<br/>Prepare & pack]

  O --> P{Pickup or delivery?}
  P -->|Pickup| Q[Notify customer<br/>Ready for pickup]
  P -->|Delivery| R[Arrange delivery<br/>Dispatch to customer]

  Q --> S([Order completed])
  R --> S

  classDef start fill:#1B5E20,color:#FFFFFF,stroke:#1B5E20
  classDef box fill:#FFFFFF,color:#263238,stroke:#90A4AE
  classDef choice fill:#E8F5E9,color:#1B5E20,stroke:#2E7D32
  classDef endn fill:#546E7A,color:#FFFFFF,stroke:#546E7A

  class A,S start
  class B,C,D,E,F,G,H,J,K,L,M,N,O,Q,R box
  class I,P choice
```

---

## Notes for trainers

- Products on the website are those **approved** and published by Youth Huza (with official shop photos).
- **Pickup** is free; **home delivery** fee is confirmed with the customer by phone (not a fixed online fee).
- Guests can check out; registered customers can also manage orders in their account.
