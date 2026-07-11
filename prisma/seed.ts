import { PrismaClient, Role, SupplierStatus, AvailabilityStatus, UnitType, DeliveryZone, OrderStatus, PaymentMethod, PaymentStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.procurementMessage.deleteMany();
  await prisma.goodsReceiptItem.deleteMany();
  await prisma.goodsReceipt.deleteMany();
  await prisma.stockBatch.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.warehouseLocation.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.supplierOffer.deleteMany();
  await prisma.returnRequest.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.newsletterSubscriber.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.supportMessage.deleteMany();
  await prisma.supportThread.deleteMany();
  await prisma.contactMessage.deleteMany();
  await prisma.faqItem.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.orderStatusLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.review.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.stockHistory.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.address.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.businessHours.deleteMany();
  await prisma.holiday.deleteMany();
  await prisma.emergencyClosure.deleteMany();
  await prisma.testimonial.deleteMany();
  await prisma.errorLog.deleteMany();
  await prisma.homepageBanner.deleteMany();
  await prisma.websiteSetting.deleteMany();
  await prisma.deliveryZoneConfig.deleteMany();
  await prisma.orderSequence.deleteMany();
  await prisma.user.deleteMany();

  const password = await bcrypt.hash("password123", 10);

  await prisma.user.create({
    data: {
      email: "admin@youthhuza.rw",
      phone: "0780000001",
      passwordHash: password,
      fullName: "Huza Admin",
      role: Role.ADMIN,
    },
  });

  const customer = await prisma.user.create({
    data: {
      email: "customer@example.com",
      phone: "0788000002",
      passwordHash: password,
      fullName: "Uwase Grace",
      role: Role.CUSTOMER,
      addresses: {
        create: {
          label: "Home",
          fullAddress: "KN 5 Ave, Kacyiru, Kigali",
          district: "Gasabo",
          isDefault: true,
        },
      },
    },
  });

  const delivery = await prisma.user.create({
    data: {
      email: "delivery@youthhuza.rw",
      phone: "0780000003",
      passwordHash: password,
      fullName: "Niyonsenga Eric",
      role: Role.DELIVERY,
    },
  });

  await prisma.user.create({
    data: {
      email: "warehouse@youthhuza.rw",
      phone: "0780000004",
      passwordHash: password,
      fullName: "Uwimana Claire",
      role: Role.WAREHOUSE,
    },
  });

  await prisma.user.create({
    data: {
      email: "procurement@youthhuza.rw",
      phone: "0780000005",
      passwordHash: password,
      fullName: "Habimana Patrick",
      role: Role.PROCUREMENT,
    },
  });

  await prisma.vehicle.create({
    data: { plateNumber: "RAD 123 A", label: "Huza Van 1", capacityKg: 800 },
  });

  await prisma.warehouseLocation.createMany({
    data: [
      { code: "A-01", name: "Cold room A", zone: "Cold" },
      { code: "B-02", name: "Dry storage B", zone: "Dry" },
      { code: "C-03", name: "Receiving dock", zone: "Dock" },
    ],
  });

  const supplierUsers = await Promise.all([
    prisma.user.create({
      data: {
        email: "greenvalley@farm.rw",
        phone: "0781111001",
        passwordHash: password,
        fullName: "Mukamana Alice",
        role: Role.SUPPLIER,
      },
    }),
    prisma.user.create({
      data: {
        email: "freshfields@farm.rw",
        phone: "0781111002",
        passwordHash: password,
        fullName: "Habimana Jean",
        role: Role.SUPPLIER,
      },
    }),
    prisma.user.create({
      data: {
        email: "lakeharvest@farm.rw",
        phone: "0781111003",
        passwordHash: password,
        fullName: "Ingabire Claire",
        role: Role.SUPPLIER,
      },
    }),
  ]);

  const suppliers = await Promise.all([
    prisma.supplier.create({
      data: {
        userId: supplierUsers[0].id,
        businessName: "Green Valley Farm",
        description: "Organic fruits and vegetables from Musanze highlands.",
        location: "Musanze",
        district: "Musanze",
        phone: "0781111001",
        status: SupplierStatus.APPROVED,
        availability: AvailabilityStatus.OPEN,
        ratingAvg: 4.8,
        ratingCount: 42,
        approvedAt: new Date(),
        isVerified: true,
        verificationBadge: "Youth Huza Verified",
      },
    }),
    prisma.supplier.create({
      data: {
        userId: supplierUsers[1].id,
        businessName: "Fresh Fields Cooperative",
        description: "Cereals, dairy and spices from Kamonyi farmers.",
        location: "Ruyenzi, Kamonyi",
        district: "Kamonyi",
        phone: "0781111002",
        status: SupplierStatus.APPROVED,
        availability: AvailabilityStatus.OPEN,
        ratingAvg: 4.6,
        ratingCount: 28,
        approvedAt: new Date(),
        isVerified: true,
        verificationBadge: "Youth Huza Verified",
      },
    }),
    prisma.supplier.create({
      data: {
        userId: supplierUsers[2].id,
        businessName: "Lake Harvest",
        description: "Fresh fish, poultry and eggs from Bugesera.",
        location: "Nyamata, Bugesera",
        district: "Bugesera",
        phone: "0781111003",
        status: SupplierStatus.APPROVED,
        availability: AvailabilityStatus.OPEN,
        ratingAvg: 4.7,
        ratingCount: 35,
        approvedAt: new Date(),
        isVerified: true,
        verificationBadge: "Youth Huza Verified",
      },
    }),
  ]);

  const pendingSupplierUser = await prisma.user.create({
    data: {
      email: "newfarm@example.rw",
      phone: "0781111999",
      passwordHash: password,
      fullName: "Bizimana Paul",
      role: Role.SUPPLIER,
    },
  });

  await prisma.supplier.create({
    data: {
      userId: pendingSupplierUser.id,
      businessName: "Sunrise Honey Co-op",
      description: "Natural honey from Eastern Province.",
      location: "Kayonza",
      district: "Kayonza",
      phone: "0781111999",
      status: SupplierStatus.PENDING,
      availability: AvailabilityStatus.CLOSED,
    },
  });

  const categories = await Promise.all(
    [
      { slug: "fruits", nameEn: "Fruits", nameFr: "Fruits", nameRw: "Imbuto", sortOrder: 1 },
      { slug: "vegetables", nameEn: "Vegetables", nameFr: "Légumes", nameRw: "Imboga", sortOrder: 2 },
      { slug: "cereals", nameEn: "Cereals", nameFr: "Céréales", nameRw: "Ibinyampeke", sortOrder: 3 },
      { slug: "dairy", nameEn: "Dairy", nameFr: "Produits laitiers", nameRw: "Amata n'ibikomoka ku mata", sortOrder: 4 },
      { slug: "meat", nameEn: "Meat", nameFr: "Viande", nameRw: "Inyama", sortOrder: 5 },
      { slug: "poultry", nameEn: "Poultry", nameFr: "Volaille", nameRw: "Inkoko", sortOrder: 6 },
      { slug: "fish", nameEn: "Fish", nameFr: "Poisson", nameRw: "Amafi", sortOrder: 7 },
      { slug: "eggs", nameEn: "Eggs", nameFr: "Œufs", nameRw: "Amagi", sortOrder: 8 },
      { slug: "honey", nameEn: "Honey", nameFr: "Miel", nameRw: "Ubuki", sortOrder: 9 },
      { slug: "spices", nameEn: "Spices", nameFr: "Épices", nameRw: "Ibishimishanyo", sortOrder: 10 },
      { slug: "bakery", nameEn: "Bakery", nameFr: "Boulangerie", nameRw: "Umugati", sortOrder: 11 },
      { slug: "beverages", nameEn: "Beverages", nameFr: "Boissons", nameRw: "Ibinyobwa", sortOrder: 12 },
      { slug: "frozen-foods", nameEn: "Frozen Foods", nameFr: "Surgelés", nameRw: "Ibicuruzwa byakonjeshejwe", sortOrder: 13 },
      { slug: "household-essentials", nameEn: "Household Essentials", nameFr: "Essentiels maison", nameRw: "Ibikenewe mu rugo", sortOrder: 14 },
    ].map((c) => prisma.category.create({ data: c }))
  );

  const cat = Object.fromEntries(categories.map((c) => [c.slug, c]));

  const productsData = [
    {
      supplierId: suppliers[0].id,
      categoryId: cat.fruits.id,
      nameEn: "Fresh Avocados",
      nameFr: "Avocats frais",
      nameRw: "Avoka nshya",
      descriptionEn: "Creamy Hass avocados harvested daily from Musanze hills.",
      descriptionFr: "Avocats Hass crémeux récoltés quotidiennement des collines de Musanze.",
      descriptionRw: "Avoka Hass nziza zavanwe buri munsi mu misozi ya Musanze.",
      price: 2500,
      unit: UnitType.KG,
      stockQty: 80,
      isOrganic: true,
      isFeatured: true,
      isBestSeller: true,
      location: "Musanze",
      images: ["/images/products/avocado.svg"],
    },
    {
      supplierId: suppliers[0].id,
      categoryId: cat.fruits.id,
      nameEn: "Sweet Pineapples",
      nameFr: "Ananas sucrés",
      nameRw: "Inanasi ziryoha",
      descriptionEn: "Juicy pineapples perfect for juice or dessert.",
      descriptionFr: "Ananas juteux parfaits pour le jus ou le dessert.",
      descriptionRw: "Inanasi ziryoha ziza ku juice cyangwa dessert.",
      price: 1500,
      unit: UnitType.PIECE,
      stockQty: 60,
      isFeatured: true,
      isNewArrival: true,
      location: "Musanze",
      images: ["/images/products/pineapple.svg"],
    },
    {
      supplierId: suppliers[0].id,
      categoryId: cat.vegetables.id,
      nameEn: "Fresh Tomatoes",
      nameFr: "Tomates fraîches",
      nameRw: "Inyanya nshya",
      descriptionEn: "Ripe red tomatoes for sauces and salads.",
      descriptionFr: "Tomates rouges mûres pour sauces et salades.",
      descriptionRw: "Inyanya zitukura ziza ku sauce n'insalade.",
      price: 1200,
      unit: UnitType.KG,
      stockQty: 100,
      isBestSeller: true,
      location: "Musanze",
      images: ["/images/products/tomato.svg"],
    },
    {
      supplierId: suppliers[0].id,
      categoryId: cat.vegetables.id,
      nameEn: "Green Cabbage",
      nameFr: "Chou vert",
      nameRw: "Amashu y'icyatsi",
      descriptionEn: "Crisp cabbage heads from highland farms.",
      descriptionFr: "Choux croquants des fermes de montagne.",
      descriptionRw: "Amashu akomeye ava ku mirima yo mu misozi.",
      price: 800,
      unit: UnitType.PIECE,
      stockQty: 45,
      isOrganic: true,
      location: "Musanze",
      images: ["/images/products/cabbage.svg"],
    },
    {
      supplierId: suppliers[1].id,
      categoryId: cat.cereals.id,
      nameEn: "Irish Potatoes",
      nameFr: "Pommes de terre",
      nameRw: "Ibirayi",
      descriptionEn: "Premium Irish potatoes ideal for chips and stews.",
      descriptionFr: "Pommes de terre premium idéales pour frites et ragoûts.",
      descriptionRw: "Ibirayi byiza ku chips n'isosi.",
      price: 900,
      unit: UnitType.KG,
      stockQty: 200,
      isBestSeller: true,
      isFeatured: true,
      location: "Kamonyi",
      images: ["/images/products/potato.svg"],
    },
    {
      supplierId: suppliers[1].id,
      categoryId: cat.cereals.id,
      nameEn: "Dry Beans",
      nameFr: "Haricots secs",
      nameRw: "Ibishyimbo",
      descriptionEn: "Locally grown dry beans, rich in protein.",
      descriptionFr: "Haricots secs locaux, riches en protéines.",
      descriptionRw: "Ibishyimbo byo mu gihugu, birimo proteine nyinshi.",
      price: 1800,
      unit: UnitType.KG,
      stockQty: 150,
      location: "Kamonyi",
      images: ["/images/products/beans.svg"],
    },
    {
      supplierId: suppliers[1].id,
      categoryId: cat.dairy.id,
      nameEn: "Fresh Cow Milk",
      nameFr: "Lait de vache frais",
      nameRw: "Amata y'inka mashya",
      descriptionEn: "Farm-fresh milk delivered cold the same day.",
      descriptionFr: "Lait frais de ferme livré froid le jour même.",
      descriptionRw: "Amata mashya atangwa akonje uwo munsi.",
      price: 1000,
      unit: UnitType.LITRE,
      stockQty: 40,
      isFeatured: true,
      isNewArrival: true,
      location: "Kamonyi",
      images: ["/images/products/milk.svg"],
    },
    {
      supplierId: suppliers[1].id,
      categoryId: cat.spices.id,
      nameEn: "Red Chili Powder",
      nameFr: "Poudre de piment rouge",
      nameRw: "Urusenda rw'umutuku",
      descriptionEn: "Sun-dried chili ground for authentic Rwandan heat.",
      descriptionFr: "Piment séché au soleil moulu pour une chaleur rwandaise authentique.",
      descriptionRw: "Urusenda rwumye ku zuba rushyizwe ku buryo bw'u Rwanda.",
      price: 2000,
      unit: UnitType.PACK,
      stockQty: 30,
      location: "Kamonyi",
      images: ["/images/products/chili.svg"],
    },
    {
      supplierId: suppliers[2].id,
      categoryId: cat.fish.id,
      nameEn: "Tilapia Fresh",
      nameFr: "Tilapia frais",
      nameRw: "Tilapia nshya",
      descriptionEn: "Fresh tilapia from Bugesera lakes, cleaned and ready.",
      descriptionFr: "Tilapia frais des lacs de Bugesera, nettoyé et prêt.",
      descriptionRw: "Tilapia nshya ziva mu biyaga bya Bugesera, zisukuye.",
      price: 4500,
      unit: UnitType.KG,
      stockQty: 25,
      isFeatured: true,
      isBestSeller: true,
      location: "Bugesera",
      images: ["/images/products/tilapia.svg"],
    },
    {
      supplierId: suppliers[2].id,
      categoryId: cat.poultry.id,
      nameEn: "Free-range Chicken",
      nameFr: "Poulet fermier",
      nameRw: "Inkoko y'ubwoko",
      descriptionEn: "Whole free-range chicken, naturally raised.",
      descriptionFr: "Poulet fermier entier, élevé naturellement.",
      descriptionRw: "Inkoko yuzuye y'ubwoko, yoroye ku buryo kamere.",
      price: 12000,
      unit: UnitType.PIECE,
      stockQty: 18,
      isOrganic: true,
      location: "Bugesera",
      images: ["/images/products/chicken.svg"],
    },
    {
      supplierId: suppliers[2].id,
      categoryId: cat.eggs.id,
      nameEn: "Farm Fresh Eggs",
      nameFr: "Œufs de ferme",
      nameRw: "Amagi y'umurima",
      descriptionEn: "A dozen farm eggs collected every morning.",
      descriptionFr: "Une douzaine d'œufs de ferme collectés chaque matin.",
      descriptionRw: "Amagi 12 y'umurima yakusanyijwe buri gitondo.",
      price: 3500,
      unit: UnitType.DOZEN,
      stockQty: 50,
      isBestSeller: true,
      location: "Bugesera",
      images: ["/images/products/eggs.svg"],
    },
    {
      supplierId: suppliers[2].id,
      categoryId: cat.meat.id,
      nameEn: "Beef Steak Cuts",
      nameFr: "Tranches de bœuf",
      nameRw: "Inyama y'inka",
      descriptionEn: "Premium beef cuts, vacuum packed for freshness.",
      descriptionFr: "Tranches de bœuf premium, emballées sous vide.",
      descriptionRw: "Inyama y'inka nziza, yafunze neza.",
      price: 7500,
      unit: UnitType.KG,
      stockQty: 20,
      isNewArrival: true,
      location: "Bugesera",
      images: ["/images/products/beef.svg"],
    },
    {
      supplierId: suppliers[0].id,
      categoryId: cat.honey.id,
      nameEn: "Natural Mountain Honey",
      nameFr: "Miel de montagne naturel",
      nameRw: "Ubuki bw'umusozi",
      descriptionEn: "Raw unfiltered honey from highland bees.",
      descriptionFr: "Miel brut non filtré des abeilles de montagne.",
      descriptionRw: "Ubuki bwuzuye butayungurijwe buva ku nzuki zo mu misozi.",
      price: 8000,
      unit: UnitType.LITRE,
      stockQty: 15,
      isOrganic: true,
      isFeatured: true,
      location: "Musanze",
      images: ["/images/products/honey.svg"],
    },
    {
      supplierId: suppliers[1].id,
      categoryId: cat.vegetables.id,
      nameEn: "Fresh Mushrooms",
      nameFr: "Champignons frais",
      nameRw: "Ibinyomoro",
      descriptionEn: "Local oyster mushrooms, harvested weekly.",
      descriptionFr: "Champignons pleurotes locaux, récoltés chaque semaine.",
      descriptionRw: "Ibinyomoro byo mu gihugu, bivanwa buri cyumweru.",
      price: 3000,
      unit: UnitType.KG,
      stockQty: 12,
      isNewArrival: true,
      location: "Kamonyi",
      images: ["/images/products/mushroom.svg"],
    },
  ];

  for (const p of productsData) {
    const { images, ...data } = p;
    const product = await prisma.product.create({
      data: {
        ...data,
        originDistrict: data.location,
        nutritionalInfo:
          "Per 100g (approx): Energy, vitamins, and minerals vary by produce. Store cool and consume fresh.",
        availableDistricts:
          data.location === "Musanze"
            ? ["Musanze", "Gasabo", "Kicukiro", "Nyarugenge"]
            : data.location === "Kamonyi"
              ? ["Kamonyi", "Gasabo", "Nyarugenge", "Kicukiro"]
              : ["Bugesera", "Kicukiro", "Gasabo", "Kayonza"],
        ratingAvg: 4 + Math.random(),
        ratingCount: Math.floor(Math.random() * 40) + 5,
        images: {
          create: images.map((url, i) => ({
            url,
            alt: data.nameEn,
            sortOrder: i,
          })),
        },
        stockLogs: {
          create: {
            change: data.stockQty,
            reason: "Initial stock",
          },
        },
      },
    });

    await prisma.review.create({
      data: {
        userId: customer.id,
        productId: product.id,
        type: "PRODUCT",
        rating: 5,
        comment: "Fresh quality and fast delivery from Youth Huza!",
      },
    });
  }

  await prisma.testimonial.createMany({
    data: [
      {
        name: "Uwase Grace",
        role: "Home cook, Kigali",
        commentEn: "HUZA FRESH brings farm-fresh food to my door. No middlemen, just quality.",
        commentFr: "HUZA FRESH apporte des produits frais à ma porte. Pas d'intermédiaires, juste de la qualité.",
        commentRw: "HUZA FRESH inzaniye ibiribwa bishya ku muryango. Nta muntu wo hagati, ubuziranenge gusa.",
        rating: 5,
      },
      {
        name: "Mugisha Patrick",
        role: "Restaurant owner",
        commentEn: "Reliable suppliers and fair prices. Ordering for my kitchen is finally simple.",
        commentFr: "Fournisseurs fiables et prix justes. Commander pour ma cuisine est enfin simple.",
        commentRw: "Abatanga serivisi bizewe n'ibiciro byiza. Gutumiza ku gikoni cyanjye byoroshye.",
        rating: 5,
      },
      {
        name: "Ingabire Diane",
        role: "Busy parent",
        commentEn: "I love paying with MoMo and getting delivery the same day across Kigali.",
        commentFr: "J'adore payer avec MoMo et recevoir la livraison le jour même à Kigali.",
        commentRw: "Nkunda kwishyura na MoMo no kubona itangwa ry'umunsi umwe muri Kigali.",
        rating: 5,
      },
    ],
  });

  await prisma.promotion.createMany({
    data: [
      {
        code: "HUZA10",
        titleEn: "Welcome 10% Off",
        titleFr: "Bienvenue -10%",
        titleRw: "Murakaza neza -10%",
        descriptionEn: "Get 10% off your first order.",
        descriptionFr: "Obtenez 10% de réduction sur votre première commande.",
        descriptionRw: "Bona 10% ku gucuruza kwa mbere.",
        discountPct: 10,
        isActive: true,
      },
      {
        code: "FREEDEL",
        titleEn: "Free Kigali Delivery",
        titleFr: "Livraison gratuite à Kigali",
        titleRw: "Gutanga ku buntu muri Kigali",
        descriptionEn: "Free delivery in Kigali this weekend.",
        descriptionFr: "Livraison gratuite à Kigali ce week-end.",
        descriptionRw: "Gutanga ku buntu muri Kigali muri iki cyumweru.",
        freeDelivery: true,
        isActive: true,
      },
      {
        titleEn: "Flash Sale: Avocados",
        titleFr: "Vente flash: Avocats",
        titleRw: "Igura ryihuse: Avoka",
        descriptionEn: "Limited-time deal on fresh avocados.",
        descriptionFr: "Offre limitée sur les avocats frais.",
        descriptionRw: "Igura ryihuse ku avoka nshya.",
        discountPct: 15,
        isFlashSale: true,
        isActive: true,
      },
    ],
  });

  for (let day = 0; day < 7; day++) {
    await prisma.businessHours.create({
      data: {
        dayOfWeek: day,
        openHour: 6,
        closeHour: 21,
        isClosed: false,
      },
    });
  }

  const sampleOrder = await prisma.order.create({
    data: {
      orderNumber: "HUZA-1001",
      userId: customer.id,
      deliveryAddress: "KN 5 Ave, Kacyiru, Kigali",
      deliveryZone: DeliveryZone.KIGALI,
      deliveryFee: 5000,
      subtotal: 5000,
      total: 7000,
      status: OrderStatus.DELIVERED,
      items: {
        create: [
          {
            productId: (await prisma.product.findFirstOrThrow({ where: { nameEn: "Fresh Avocados" } })).id,
            supplierId: suppliers[0].id,
            quantity: 2,
            unitPrice: 2500,
            lineTotal: 5000,
          },
        ],
      },
      payment: {
        create: {
          method: PaymentMethod.MTN_MOMO,
          phoneNumber: "0788000002",
          amount: 7000,
          status: PaymentStatus.CONFIRMED,
          transactionRef: "MTN-DEMO-001",
          verifiedAt: new Date(),
        },
      },
      delivery: {
        create: {
          deliveryPersonId: delivery.id,
          status: OrderStatus.DELIVERED,
          estimatedMinutes: 45,
          deliveredAt: new Date(),
        },
      },
      statusLog: {
        create: [
          { status: OrderStatus.PENDING, note: "Order placed" },
          { status: OrderStatus.CONFIRMED, note: "Payment confirmed" },
          { status: OrderStatus.DELIVERED, note: "Delivered by Youth Huza" },
        ],
      },
    },
  });

  await prisma.notification.create({
    data: {
      userId: customer.id,
      type: "ORDER_CONFIRMATION",
      channel: "IN_APP",
      title: "Order delivered",
      body: `Your order ${sampleOrder.orderNumber} was delivered. Thank you for shopping with HUZA FRESH!`,
      isRead: false,
    },
  });

  await prisma.faqItem.createMany({
    data: [
      {
        sortOrder: 1,
        questionEn: "Who delivers my order?",
        questionFr: "Qui livre ma commande ?",
        questionRw: "Ninde utanga ibicuruzwa?",
        answerEn: "Youth Huza delivers directly — there is no middleman for deliveries.",
        answerFr: "Youth Huza livre directement — pas d'intermédiaire.",
        answerRw: "Youth Huza itanga ubwayo — nta muntu wo hagati.",
      },
      {
        sortOrder: 2,
        questionEn: "How do I pay?",
        questionFr: "Comment payer ?",
        questionRw: "Nishyura nte?",
        answerEn:
          "Pay Youth Huza with MTN MoMo or Airtel Money — approve the prompt on your phone. Bank cards are coming soon. Cash on Delivery is not available.",
        answerFr:
          "Payez Youth Huza via MTN MoMo ou Airtel Money — approuvez l’invite sur votre téléphone. Les cartes bancaires arrivent bientôt. Le paiement à la livraison n’est pas disponible.",
        answerRw:
          "Ishyura Youth Huza ukoresheje MTN MoMo cyangwa Airtel Money — emera ubutumire kuri telefone. Amakarita ya banki aza vuba. Nta kwishyura amafaranga iyo bagutegereje.",
      },
      {
        sortOrder: 3,
        questionEn: "Can I track my order?",
        questionFr: "Puis-je suivre ma commande ?",
        questionRw: "Nshobora gukurikirana ibicuruzwa?",
        answerEn: "Yes — use Track Order with your order number and checkout phone.",
        answerFr: "Oui — utilisez Suivi de commande avec votre numéro et téléphone.",
        answerRw: "Yego — koresha Track Order hamwe n'nimero y'ibicuruzwa na telefone.",
      },
    ],
  });

  await prisma.auditLog.create({
    data: {
      actorName: "System",
      action: "seed.complete",
      entity: "Platform",
      details: "Initial HUZA FRESH seed by Youth Huza",
    },
  });

  console.log("Seed complete.");
  console.log("Admin: admin@youthhuza.rw / password123");
  console.log("Customer: customer@example.com / password123");
  
  await prisma.deliveryZoneConfig.createMany({
    data: [
      { id: "zone-kigali", code: "KIGALI", labelEn: "Kigali", labelFr: "Kigali", labelRw: "Kigali", feeRwf: 5000, etaMinutes: 45, sortOrder: 1 },
      { id: "zone-kamonyi", code: "KAMONYI_RUYENZI", labelEn: "Kamonyi (Ruyenzi)", labelFr: "Kamonyi (Ruyenzi)", labelRw: "Kamonyi (Ruyenzi)", feeRwf: 5000, etaMinutes: 75, sortOrder: 2 },
      { id: "zone-bugesera", code: "BUGESERA_NYAMATA", labelEn: "Bugesera (Nyamata)", labelFr: "Bugesera (Nyamata)", labelRw: "Bugesera (Nyamata)", feeRwf: 5000, etaMinutes: 75, sortOrder: 3 },
    ],
  });

  await prisma.websiteSetting.createMany({
    data: [
      { key: "company_name", value: "Youth Huza" },
      { key: "brand_name", value: "HUZA FRESH" },
      { key: "phone", value: "+250 788 000 000" },
      { key: "email", value: "hello@youthhuza.rw" },
      { key: "currency", value: "RWF" },
      { key: "facebook_url", value: "https://facebook.com" },
      { key: "instagram_url", value: "https://instagram.com" },
      { key: "whatsapp_url", value: "https://wa.me/250788000000" },
    ],
  });

  await prisma.orderSequence.create({ data: { year: new Date().getFullYear(), lastValue: 245 } });

console.log("Supplier: greenvalley@farm.rw / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
