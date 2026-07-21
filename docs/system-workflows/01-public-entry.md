# Diagram 1 — Public Entry Page

How visitors first enter the Youth Huza platform.

**Portal:** Public Entry (`youthhuza.rw` home)

---

```mermaid
%%{init: {'theme':'base', 'themeVariables': { 'fontFamily':'arial', 'primaryColor':'#E8F5E9', 'primaryTextColor':'#1B5E20', 'primaryBorderColor':'#2E7D32', 'lineColor':'#607D8B', 'secondaryColor':'#FFFFFF', 'tertiaryColor':'#ECEFF1'}}}%%
flowchart TB
  START([Visitor opens Youth Huza]) --> LAND[Landing page<br/>Youth Huza brand & welcome]
  LAND --> CHOICE{What do you need?}

  CHOICE -->|Shop fresh food| FRESH[Customer Website<br/>HUZA FRESH]
  CHOICE -->|Join as a farmer| GROW[Farmers Portal<br/>HUZA GROW]

  FRESH --> GO_SHOP[Browse products & order]
  GROW --> GO_FARM[Learn, register, or log in]

  GO_SHOP --> END1([Continue on HUZA FRESH])
  GO_FARM --> END2([Continue on Farmers Portal])

  classDef start fill:#1B5E20,color:#FFFFFF,stroke:#1B5E20,rx:10
  classDef box fill:#FFFFFF,color:#263238,stroke:#90A4AE,rx:8
  classDef choice fill:#E8F5E9,color:#1B5E20,stroke:#2E7D32,rx:8
  classDef endn fill:#546E7A,color:#FFFFFF,stroke:#546E7A,rx:10

  class START,END1,END2 start
  class LAND,FRESH,GROW,GO_SHOP,GO_FARM box
  class CHOICE choice
```

---

## In plain words

1. Anyone opens the **Youth Huza** landing page.
2. They choose **Customer Website** (buy food) or **Farmers Portal** (partner / sell harvest).
3. The site sends them to the chosen portal.

No account is required to view the landing page.
