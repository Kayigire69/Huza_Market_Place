# Diagram 10 — Delivery & Pickup

How fulfilled orders reach the customer.

---

```mermaid
%%{init: {'theme':'base', 'themeVariables': { 'fontFamily':'arial', 'primaryColor':'#E8F5E9', 'primaryTextColor':'#1B5E20', 'primaryBorderColor':'#2E7D32', 'lineColor':'#607D8B'}}}%%
flowchart TB
  A([Order ready<br/>Packed & payment OK]) --> B{Fulfillment method}

  B -->|Pickup| C[Ready for pickup]
  C --> D[Notify customer]
  D --> E[Customer collects at Youth Huza]
  E --> F([Order closed · Delivered / completed])

  B -->|Home delivery| G[Ready for dispatch]
  G --> H[Assign delivery person]
  H --> I[Out for delivery]
  I --> J[Customer receives products]
  J --> F

  classDef start fill:#1B5E20,color:#FFFFFF,stroke:#1B5E20
  classDef box fill:#FFFFFF,color:#263238,stroke:#90A4AE
  classDef choice fill:#E8F5E9,color:#1B5E20,stroke:#2E7D32
  classDef endn fill:#546E7A,color:#FFFFFF,stroke:#546E7A

  class A,F start
  class C,D,E,G,H,I,J box
  class B choice
```

---

## Notes for trainers

- Delivery staff use the **Delivery Portal**; managers also manage deliveries in Admin.
- Home delivery fee and timing are confirmed with the customer (often by phone), not as a fixed online calculator.
