# Diagram 3 — Customer Account

How a customer creates and uses their HUZA FRESH account.

---

```mermaid
%%{init: {'theme':'base', 'themeVariables': { 'fontFamily':'arial', 'primaryColor':'#E8F5E9', 'primaryTextColor':'#1B5E20', 'primaryBorderColor':'#2E7D32', 'lineColor':'#607D8B'}}}%%
flowchart TB
  A([New or returning customer]) --> B{Have an account?}
  B -->|No| C[Register<br/>Name, phone, password]
  B -->|Yes| D[Login]
  C --> D

  D --> E[My Account home]
  E --> F[Manage profile<br/>Name, phone, password]
  E --> G[Saved addresses]
  E --> H[View my orders]
  E --> I[Track an order<br/>Order number + phone]

  H --> J[Open receipt / invoice when available]
  I --> J

  E --> K[Logout]
  K --> L([Back to shop as guest or login again])

  classDef start fill:#1B5E20,color:#FFFFFF,stroke:#1B5E20
  classDef box fill:#FFFFFF,color:#263238,stroke:#90A4AE
  classDef choice fill:#E8F5E9,color:#1B5E20,stroke:#2E7D32
  classDef endn fill:#546E7A,color:#FFFFFF,stroke:#546E7A

  class A,L start
  class C,D,E,F,G,H,I,J,K box
  class B choice
```

---

## Notes for trainers

- Tracking can also be done from the public **Track order** page without opening the full account.
- Wishlist and cart sync when the customer is logged in.
