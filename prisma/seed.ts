import "dotenv/config";
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
  await prisma.passwordResetToken.deleteMany();
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
  const ownerPassword = await bcrypt.hash("Huza@2026!", 10);

  // Primary Super Admin — created at system setup (not via the public website).
  // Owner must change this temporary password on first login.
  await prisma.user.create({
    data: {
      email: "owner@huza.rw",
      phone: "0780000000",
      passwordHash: ownerPassword,
      fullName: "YOUTH HUZA Owner",
      role: Role.SUPER_ADMIN,
      mustChangePassword: true,
      isPrimarySuperAdmin: true,
    },
  });

  // Day-to-day shift admins — cannot see Staff / Audit / System Settings
  const alice = await prisma.user.create({
    data: {
      email: "alice@huza.rw",
      phone: "0780000001",
      passwordHash: password,
      fullName: "Alice Uwimana",
      role: Role.ADMIN,
    },
  });

  const john = await prisma.user.create({
    data: {
      email: "john@huza.rw",
      phone: "0780000011",
      passwordHash: password,
      fullName: "John Habimana",
      role: Role.ADMIN,
    },
  });

  await prisma.auditLog.createMany({
    data: [
      {
        actorId: alice.id,
        actorName: alice.fullName,
        actorEmail: alice.email,
        action: "seed.admin_ready",
        entity: "User",
        entityId: alice.id,
        details: "Alice ADMIN account for operational shifts (no Staff/Audit/Settings access)",
        ipAddress: "seed",
      },
      {
        actorId: john.id,
        actorName: john.fullName,
        actorEmail: john.email,
        action: "seed.admin_ready",
        entity: "User",
        entityId: john.id,
        details: "John ADMIN account for operational shifts (no Staff/Audit/Settings access)",
        ipAddress: "seed",
      },
    ],
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
    (
      await import("./catalog-data")
    ).CATALOG_CATEGORIES.map((c) =>
      prisma.category.create({
        data: {
          slug: c.slug,
          nameEn: c.nameEn,
          nameFr: c.nameFr,
          nameRw: c.nameRw,
          sortOrder: c.sortOrder,
          imageUrl: c.image,
        },
      })
    )
  );

  const cat = Object.fromEntries(categories.map((c) => [c.slug, c]));
  const { CATALOG_PRODUCTS } = await import("./catalog-data");

  const deliveryDistricts = ["Gasabo", "Kicukiro", "Nyarugenge", "Kamonyi", "Bugesera"];

  const productsData = CATALOG_PRODUCTS.map((p, i) => ({
    supplierId: suppliers[i % suppliers.length].id,
    categoryId: cat[p.category].id,
    nameEn: p.nameEn,
    nameFr: p.nameFr,
    nameRw: p.nameRw,
    descriptionEn: p.descriptionEn,
    descriptionFr: p.descriptionFr,
    descriptionRw: p.descriptionRw,
    price: p.price,
    purchasePrice: Math.round(p.price * 0.65),
    unit: UnitType[p.unit],
    stockQty: p.stockQty,
    isOrganic: Boolean(p.isOrganic),
    isFeatured: Boolean(p.isFeatured),
    isBestSeller: Boolean(p.isBestSeller),
    isNewArrival: Boolean(p.isNewArrival),
    originDistrict: p.originDistrict,
    location: p.originDistrict,
    keywords: p.keywords,
    reviewStatus: "APPROVED",
    reviewedAt: new Date(),
    images: [p.image],
  }));

  for (const p of productsData) {
    const { images, ...data } = p;
    const product = await prisma.product.create({
      data: {
        ...data,
        originDistrict: data.location,
        nutritionalInfo:
          "Per 100g (approx): Energy, vitamins, and minerals vary by produce. Store cool and consume fresh.",
        availableDistricts: deliveryDistricts,
        ratingAvg: 4 + Math.random(),
        ratingCount: Math.floor(Math.random() * 40) + 5,
        images: {
          create: images.map((url, i) => ({
            url,
            alt: data.nameEn,
            sortOrder: i,
            kind: "STOREFRONT" as const,
            isCover: i === 0,
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
        commentEn: "Reliable farmers and fair prices. Ordering for my kitchen is finally simple.",
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

  await prisma.deliveryZoneConfig.createMany({
    data: [
      { id: "zone-kigali", code: "KIGALI", labelEn: "Kigali", labelFr: "Kigali", labelRw: "Kigali", feeRwf: 5000, etaMinutes: 90, etaLabelEn: "45–90 minutes", sortOrder: 1 },
      { id: "zone-kamonyi", code: "KAMONYI_RUYENZI", labelEn: "Kamonyi", labelFr: "Kamonyi", labelRw: "Kamonyi", feeRwf: 5000, etaMinutes: 180, etaLabelEn: "2–3 hours", sortOrder: 2 },
      { id: "zone-bugesera", code: "BUGESERA_NYAMATA", labelEn: "Bugesera", labelFr: "Bugesera", labelRw: "Bugesera", feeRwf: 5000, etaMinutes: 180, etaLabelEn: "2–3 hours", sortOrder: 3 },
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

  console.log("Seed complete.");
  console.log("Super Admin (setup — change password on first login):");
  console.log("  owner@huza.rw / Huza@2026!");
  console.log("Shift Admins (cannot see Staff / Audit / Settings):");
  console.log("  alice@huza.rw / password123");
  console.log("  john@huza.rw / password123");
  console.log("Customer: customer@example.com / password123");
  console.log("Farmer: greenvalley@farm.rw / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
