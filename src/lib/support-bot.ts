type Locale = "en" | "fr" | "rw" | "sw";

function detectLocale(text: string, preferred?: string): Locale {
  if (preferred === "fr" || preferred === "rw" || preferred === "en" || preferred === "sw") {
    return preferred;
  }
  const t = text.toLowerCase();
  if (
    /\b(bonjour|merci|commande|livraison|paiement|produit|prix|compte|fermez|horaires|jours)\b/.test(
      t
    ) ||
    /\b(je |vous |où |comment |quand )\b/.test(t)
  ) {
    return "fr";
  }
  if (
    /\b(muraho|murakoze|igicuruzwa|gutanga|kwishyura|igiciro|konti|amakuru|mufungura|iminsi)\b/.test(
      t
    ) ||
    /\b(ese |nihe |gute |ryari )\b/.test(t)
  ) {
    return "rw";
  }
  if (
    /\b(habari|asante|bidhaa|agizo|uwasilishaji|malipo|bei|akaunti|karibu|funga|siku)\b/.test(t) ||
    /\b(ninaweza|tafadhali|sasa |mnafunga|mnafanya)\b/.test(t)
  ) {
    return "sw";
  }
  return "en";
}

/** 25+ FAQ intents — each answered in EN / FR / RW / SW */
const replies: Record<string, Record<Locale, string>> = {
  greeting: {
    en: "Hello! Welcome to HUZA FRESH by Youth Huza. Ask about hours, delivery, payments, orders, products, farmers, refunds, or your account — in English, French, Kinyarwanda, or Kiswahili.",
    fr: "Bonjour ! Bienvenue sur HUZA FRESH par Youth Huza. Posez vos questions sur les horaires, livraison, paiements, commandes, produits, agriculteurs, remboursements ou votre compte.",
    rw: "Muraho! Murakaza neza kuri HUZA FRESH ya Youth Huza. Baza ku masaha, gutanga, kwishyura, ibicuruzwa, abahinzi, gusubizwa cyangwa konti yawe.",
    sw: "Habari! Karibu HUZA FRESH ya Youth Huza. Uliza kuhusu saa, uwasilishaji, malipo, maagizo, bidhaa, wakulima, marejesho, au akaunti yako.",
  },

  // 1–2 Hours / closing / days open
  hours: {
    en: "We are open every day from 6:00 AM to 9:00 PM (Kigali time). You can browse the shop anytime; if you order outside hours, we schedule delivery for the next business day.",
    fr: "Nous sommes ouverts tous les jours de 6h00 à 21h00 (heure de Kigali). Vous pouvez parcourir le site à tout moment ; hors horaires, la livraison est planifiée pour le prochain jour ouvrable.",
    rw: "Dufungura buri munsi kuva saa 12 za mu gitondo kugeza saa 3 z'ijoro (isaha ya Kigali). Urashobora gureba iduka igihe icyo ari cyo cyose; iyo utumije hanze y'amasaha, gutanga biteganyirizwa umunsi ukurikira.",
    sw: "Tuko wazi kila siku kuanzia saa 12 asubuhi hadi saa 3 usiku (saa za Kigali). Unaweza kuvinjari dukani wakati wowote; ukiagiza nje ya saa hizo, uwasilishaji hupangwa kwa siku inayofuata ya kazi.",
  },
  closingTime: {
    en: "We close at 9:00 PM every evening. Orders placed after closing are accepted online and scheduled for the next day.",
    fr: "Nous fermons à 21h00 chaque soir. Les commandes passées après la fermeture sont acceptées en ligne et planifiées pour le lendemain.",
    rw: "Dufunga saa 3 z'ijoro buri mugoroba. Ibicuruzwa byatumijwe nyuma yo gufunga byakira online bigateganyirizwa umunsi ukurikira.",
    sw: "Tunafunga saa 3 usiku kila jioni. Maagizo yaliyowekwa baada ya kufunga yanakubaliwa mtandaoni na kupangwa kwa siku inayofuata.",
  },
  openingTime: {
    en: "We open at 6:00 AM every morning — seven days a week.",
    fr: "Nous ouvrons à 6h00 chaque matin — sept jours sur sept.",
    rw: "Dufungura saa 12 za mu gitondo buri munsi — iminsi 7 mu cyumweru.",
    sw: "Tunafungua saa 12 asubuhi kila asubuhi — siku saba kwa wiki.",
  },
  workDays: {
    en: "We work 7 days a week (Monday–Sunday), including weekends and most public holidays, from 6:00 AM to 9:00 PM.",
    fr: "Nous travaillons 7 jours sur 7 (lundi–dimanche), y compris les week-ends et la plupart des jours fériés, de 6h00 à 21h00.",
    rw: "Dukora iminsi 7 mu cyumweru (kuwa mbere–ku cyumweru), harimo n'impera n'iminsi mikuru, kuva saa 12 kugeza saa 3 z'ijoro.",
    sw: "Tunafanya kazi siku 7 kwa wiki (Jumatatu–Jumapili), pamoja na wikendi na sikukuu nyingi, kuanzia saa 12 asubuhi hadi saa 3 usiku.",
  },
  weekend: {
    en: "Yes — we are open on Saturdays and Sundays, same hours: 6:00 AM – 9:00 PM.",
    fr: "Oui — nous sommes ouverts le samedi et le dimanche, aux mêmes horaires : 6h00 – 21h00.",
    rw: "Yego — dufungura ku wa gatandatu no ku cyumweru, amasaha amwe: saa 12 – saa 3 z'ijoro.",
    sw: "Ndiyo — tuko wazi Jumamosi na Jumapili, saa zile zile: saa 12 asubuhi – saa 3 usiku.",
  },

  // 3 Delivery
  delivery: {
    en: "Youth Huza delivers to Kigali, Kamonyi (Ruyenzi), and Bugesera (Nyamata). Flat delivery fee: 5,000 RWF. At checkout choose Today, Tomorrow, or Scheduled delivery and share your address or live location.",
    fr: "Youth Huza livre à Kigali, Kamonyi (Ruyenzi) et Bugesera (Nyamata). Tarif unique : 5 000 RWF. Choisissez Aujourd’hui, Demain ou Planifié et partagez votre adresse ou position.",
    rw: "Youth Huza itanga i Kigali, Kamonyi (Ruyenzi), na Bugesera (Nyamata). Igiciro kimwe: 5,000 RWF. Hitamo Uyu munsi, Ejo cyangwa Iteganyijwe hanyuma ushyire aderesi cyangwa aho uri.",
    sw: "Youth Huza inawasilisha Kigali, Kamonyi (Ruyenzi), na Bugesera (Nyamata). Ada ya kawaida: 5,000 RWF. Chagua Leo, Kesho, au Ratiba, kisha shiriki anwani au eneo lako.",
  },
  deliveryFee: {
    en: "Delivery is a flat 5,000 RWF for all covered zones (Kigali, Kamonyi/Ruyenzi, Bugesera/Nyamata).",
    fr: "La livraison coûte 5 000 RWF pour toutes les zones couvertes (Kigali, Kamonyi/Ruyenzi, Bugesera/Nyamata).",
    rw: "Gutanga ni 5,000 RWF ku turere twose (Kigali, Kamonyi/Ruyenzi, Bugesera/Nyamata).",
    sw: "Ada ya uwasilishaji ni 5,000 RWF kwa maeneo yote (Kigali, Kamonyi/Ruyenzi, Bugesera/Nyamata).",
  },
  deliveryTime: {
    en: "Typical ETA: about 45 minutes in Kigali, and about 75 minutes for Kamonyi (Ruyenzi) or Bugesera (Nyamata), depending on traffic and order volume.",
    fr: "Délai typique : environ 45 min à Kigali, et environ 75 min pour Kamonyi (Ruyenzi) ou Bugesera (Nyamata), selon le trafic et le volume.",
    rw: "Igihe gisanzwe: hafi iminota 45 i Kigali, n'iminota 75 i Kamonyi (Ruyenzi) cyangwa Bugesera (Nyamata), bitewe n'imihanda n'ibicuruzwa.",
    sw: "Muda wa kawaida: takriban dakika 45 Kigali, na dakika 75 Kamonyi (Ruyenzi) au Bugesera (Nyamata), kulingana na msongamano na maagizo.",
  },

  // 4 Payment
  payment: {
    en: "Pay Youth Huza with MTN MoMo or Airtel Money only. After checkout, approve the payment prompt on your phone. Bank card payments are coming soon. Cash on Delivery is not available.",
    fr: "Payez Youth Huza uniquement via MTN MoMo ou Airtel Money. Après la commande, approuvez l’invite sur votre téléphone. Les cartes bancaires arrivent bientôt. Le paiement à la livraison n’est pas disponible.",
    rw: "Ishyura Youth Huza gusa ukoresheje MTN MoMo cyangwa Airtel Money. Nyuma yo gutumiza, emera ubutumire kuri telefoni yawe. Amakarita ya banki aza vuba. Nta kwishyura amafaranga iyo bagutegereje.",
    sw: "Lipa Youth Huza kwa MTN MoMo au Airtel Money tu. Baada ya kuagiza, idhinisha ombi kwenye simu yako. Malipo ya kadi ya benki yanakuja hivi karibuni. Hakuna malipo taslimu wakati wa uwasilishaji.",
  },
  momo: {
    en: "For MTN MoMo or Airtel Money, enter the phone that will receive the payment prompt. Approve it on that phone within a few minutes. Stock is reserved for about 10 minutes while we wait.",
    fr: "Pour MTN MoMo ou Airtel Money, entrez le numéro qui recevra l’invite. Approuvez sous quelques minutes. Le stock est réservé environ 10 minutes.",
    rw: "Ku MTN MoMo cyangwa Airtel Money, andika telefoni izakira ubutumire. Emera mu minota mike. Ububiko buzigamwa hafi iminota 10.",
    sw: "Kwa MTN MoMo au Airtel Money, weka simu itakayopokea ombi. Idhinisha ndani ya dakika chache. Hisa huhifadhiwa kwa takriban dakika 10.",
  },
  card: {
    en: "Bank card payments are coming soon on HUZA FRESH. Today please pay with MTN MoMo or Airtel Money.",
    fr: "Les paiements par carte bancaire arrivent bientôt sur HUZA FRESH. Aujourd’hui, payez avec MTN MoMo ou Airtel Money.",
    rw: "Kwishyura n'ikarita ya banki biza vuba kuri HUZA FRESH. Uyu munsi shyiramo MTN MoMo cyangwa Airtel Money.",
    sw: "Malipo ya kadi ya benki yanakuja hivi karibuni kwenye HUZA FRESH. Leo lipa kwa MTN MoMo au Airtel Money.",
  },
  cod: {
    en: "Cash on Delivery is not available. Please pay with MTN MoMo or Airtel Money at checkout. Bank cards are coming soon.",
    fr: "Le paiement à la livraison n’est pas disponible. Payez avec MTN MoMo ou Airtel Money. Les cartes bancaires arrivent bientôt.",
    rw: "Nta kwishyura amafaranga iyo bagutegereje. Shyiramo MTN MoMo cyangwa Airtel Money. Amakarita ya banki aza vuba.",
    sw: "Hakuna malipo taslimu wakati wa uwasilishaji. Lipa kwa MTN MoMo au Airtel Money. Kadi za benki zinakuja hivi karibuni.",
  },

  // 5 Tracking / orders
  track: {
    en: "To track an order: open Track Order, enter your order number (e.g. HZ-2026-000245) and the phone used at checkout. You also find it in My Account → Orders after login.",
    fr: "Pour suivre une commande : ouvrez Suivi de commande, entrez votre numéro (ex. HZ-2026-000245) et le téléphone du paiement. Aussi dans Mon compte → Commandes.",
    rw: "Kugira ngo ukurikirane: fungura Track Order, andika numero (urugero HZ-2026-000245) n'telefone wakoresheje. Nanone muri Konti → Ibicuruzwa.",
    sw: "Kufuatilia: fungua Track Order, weka nambari (mfano HZ-2026-000245) na simu ya malipo. Pia katika Akaunti → Maagizo.",
  },
  orderNumber: {
    en: "Order numbers look like HZ-2026-000245. You see yours on the payment success screen, in SMS/notifications when available, and under My Account → Orders.",
    fr: "Les numéros de commande ressemblent à HZ-2026-000245. Vous le voyez après paiement, dans les notifications, et dans Mon compte → Commandes.",
    rw: "Numero z'ibicuruzwa zisa na HZ-2026-000245. Uzibona nyuma yo kwishyura, mu makuru, no muri Konti → Ibicuruzwa.",
    sw: "Nambari za maagizo zinaonekana kama HZ-2026-000245. Unaiona baada ya malipo, katika arifa, na Akaunti → Maagizo.",
  },
  cancelOrder: {
    en: "To cancel or change an order, message us here with your order number, open a Support ticket, or call +250 788 000 000 as soon as possible — before the rider leaves.",
    fr: "Pour annuler ou modifier, écrivez-nous ici avec votre numéro, créez un ticket Support, ou appelez +250 788 000 000 rapidement — avant le départ du livreur.",
    rw: "Kugira ngo uhagarike cyangwa uhindure, twandikire hano ufite numero, ukore ticket, cyangwa hamagara +250 788 000 000 vuba — mbere y'uko umutangaji agenda.",
    sw: "Kughairi au kubadilisha, tuandikie hapa na nambari ya agizo, fungua tiketi ya Support, au piga +250 788 000 000 haraka — kabla dereva hajaondoka.",
  },

  // 6 Products / prices / quality
  products: {
    en: "Browse Products or Categories (fruits, vegetables, dairy, meat, and more). Prices are set by Youth Huza. Search by name, category, or use filters for stock and new arrivals.",
    fr: "Parcourez Produits ou Catégories (fruits, légumes, laitiers, viande…). Les prix sont fixés par Youth Huza. Cherchez par nom, catégorie ou filtres.",
    rw: "Reba Ibicuruzwa cyangwa Ibyiciro (imbuto, imboga, amata, inyama…). Ibiciro bishyirwaho na Youth Huza. Shakisha izina cyangwa icyiciro.",
    sw: "Vinjari Bidhaa au Kategoria (matunda, mboga, maziwa, nyama…). Bei huwekwa na Youth Huza. Tafuta kwa jina au kategoria.",
  },
  prices: {
    en: "All prices on HUZA FRESH are in Rwandan Francs (RWF) and already include Youth Huza’s retail pricing. Delivery is shown separately at checkout (5,000 RWF).",
    fr: "Tous les prix sur HUZA FRESH sont en francs rwandais (RWF) et correspondent au tarif de détail Youth Huza. La livraison (5 000 RWF) s’affiche au paiement.",
    rw: "Ibiciro byose kuri HUZA FRESH ni mu mafaranga y'u Rwanda (RWF). Amafaranga yo gutanga (5,000 RWF) agaragara iyo wishyura.",
    sw: "Bei zote kwenye HUZA FRESH ni kwa Faranga za Rwanda (RWF). Ada ya uwasilishaji (5,000 RWF) inaonekana wakati wa kulipa.",
  },
  quality: {
    en: "Youth Huza inspects produce before it reaches your cart. You buy from HUZA FRESH — one brand, one quality standard — not from individual farm names on the storefront.",
    fr: "Youth Huza inspecte les produits avant qu’ils n’arrivent dans votre panier. Vous achetez sur HUZA FRESH — une marque, un standard — pas sous le nom de chaque ferme.",
    rw: "Youth Huza igenzura ibihingwa mbere yo kugera mu gakapu. Ugura kuri HUZA FRESH — ikirango kimwe — ntabwo ugura ku mazina y'abahinzi ku iduka.",
    sw: "Youth Huza hukagua mazao kabla hayafike kikapuni. Unanunua kutoka HUZA FRESH — chapa moja, kiwango kimoja — si majina ya mashamba kwenye duka.",
  },
  organic: {
    en: "Products marked Organic are flagged by Huza after review. Check the product page badge and description for details.",
    fr: "Les produits marqués Bio sont validés par Huza après contrôle. Voir le badge et la description sur la fiche produit.",
    rw: "Ibicuruzwa byanditse Organic byemejwe na Huza. Reba ikimenyetso n'ibisobanuro ku rupapuro rw'igicuruzwa.",
    sw: "Bidhaa zilizoandikwa Organic huthibitishwa na Huza. Angalia beji na maelezo kwenye ukurasa wa bidhaa.",
  },
  stock: {
    en: "Availability shows as In stock, Low stock, Out of stock, Coming soon, or Temporarily unavailable. Low stock means limited quantity — order soon.",
    fr: "Disponibilité : En stock, Stock bas, Rupture, Bientôt disponible ou Temporairement indisponible. Stock bas = quantité limitée.",
    rw: "Kuboneka: Birahari, Bike bisigaye, Byarangiye, Biza vuba cyangwa Ntibiboneka. Bike bisigaye = byihutire gutumiza.",
    sw: "Upatikanaji: Ipo, Imebaki kidogo, Imeisha, Inakuja hivi karibuni, au Haipatikani kwa sasa. Imebaki kidogo = agiza haraka.",
  },

  // 7 Returns / refunds
  return: {
    en: "For returns, refunds, or quality issues: open Support (/support) with your order number and photos if possible, chat here, or see our Refund Policy. Contact us within 24 hours of delivery.",
    fr: "Pour retours, remboursements ou qualité : ouvrez Support (/support) avec votre numéro et photos, discutez ici, ou lisez la Politique de remboursement. Contactez-nous sous 24 h.",
    rw: "Ku gusubiza cyangwa ubwiza: fungura Support (/support) ufite numero n'amafoto, tungane hano, cyangwa usome Refund Policy. Twandikire mu masaha 24.",
    sw: "Kwa marejesho au ubora: fungua Support (/support) na nambari na picha, zungumza hapa, au soma Sera ya Marejesho. Wasiliana ndani ya saa 24.",
  },

  // 8 Account
  account: {
    en: "Register or log in to see Orders, Wishlist, Addresses, Notifications, and Invoices. Guests can still checkout and track with order number + phone.",
    fr: "Inscrivez-vous ou connectez-vous pour Commandes, Favoris, Adresses, Notifications et Factures. Les invités peuvent commander et suivre avec numéro + téléphone.",
    rw: "Iyandikishe cyangwa winjire urebe Ibicuruzwa, Wishlist, Aderesi, Amakuru n'Invoices. Abashyitsi barashobora gutumiza bakoresheje numero n'telefone.",
    sw: "Jisajili au ingia kuona Maagizo, Vipendwa, Anwani, Arifa, na Ankara. Wageni wanaweza kuagiza na kufuatilia kwa nambari + simu.",
  },
  password: {
    en: "Forgot your password? Log in page issues are helped via Support ticket or call +250 788 000 000. After login, change password under My Account.",
    fr: "Mot de passe oublié ? Créez un ticket Support ou appelez +250 788 000 000. Après connexion, changez-le dans Mon compte.",
    rw: "Wibagiwe ijambo ry'ibanga? Kora ticket cyangwa hamagara +250 788 000 000. Nyuma yo kwinjira, uhindure muri Konti.",
    sw: "Umesahau nenosiri? Fungua tiketi ya Support au piga +250 788 000 000. Baada ya kuingia, badilisha katika Akaunti.",
  },

  // 9 Farmers
  farmer: {
    en: "Farmers sell to Youth Huza via the Farmers Portal (/farmer). Field agents visit farms to help register and review products with photos. Customers only buy from HUZA FRESH — not from farms by name.",
    fr: "Les agriculteurs vendent à Youth Huza via le Portail agriculteurs (/farmer). Des agents visitent les fermes. Les clients achètent uniquement sur HUZA FRESH.",
    rw: "Abahinzi bagurisha kuri Youth Huza binyuze kuri Farmers Portal (/farmer). Abakozi basura abahinzi. Abakiriya bagura gusa kuri HUZA FRESH.",
    sw: "Wakulima wanauza kwa Youth Huza kupitia Tovuti ya Wakulima (/farmer). Mawakala hutembelea mashamba. Wateja hununua tu kutoka HUZA FRESH.",
  },

  // 10 Contact / about / language
  contact: {
    en: "Contact Youth Huza: +250 788 000 000 · hello@youthhuza.rw · WhatsApp from the website footer. Or keep chatting here.",
    fr: "Contact : +250 788 000 000 · hello@youthhuza.rw · WhatsApp via le pied de page. Ou continuez ici.",
    rw: "Twandikire: +250 788 000 000 · hello@youthhuza.rw · WhatsApp kuri footer. Cyangwa ukomeze hano.",
    sw: "Wasiliana: +250 788 000 000 · hello@youthhuza.rw · WhatsApp kupitia footer. Au endelea hapa.",
  },
  about: {
    en: "HUZA FRESH is powered by Youth Huza. We buy from verified farms, quality-check produce, and deliver under one trusted brand. Read more on About, Mission, and Vision pages.",
    fr: "HUZA FRESH est propulsé par Youth Huza. Nous achetons auprès de fermes vérifiées, contrôlons la qualité et livrons sous une marque. Voir À propos, Mission et Vision.",
    rw: "HUZA FRESH ikoreshwa na Youth Huza. Tugura ku bahinzi bemewe, tugenzura ubwiza, dutanga ku kirango kimwe. Soma About, Mission na Vision.",
    sw: "HUZA FRESH inaendeshwa na Youth Huza. Tunanunua kutoka mashamba yaliyothibitishwa, hukagua ubora, na kuwasilisha chini ya chapa moja. Soma About, Mission, na Vision.",
  },
  language: {
    en: "You can use the language switcher (EN / FR / RW / SW) in the header. This chat also replies in English, French, Kinyarwanda, or Kiswahili.",
    fr: "Utilisez le sélecteur de langue (EN / FR / RW / SW) dans l’en-tête. Ce chat répond aussi en français, anglais, kinyarwanda ou kiswahili.",
    rw: "Hindura ururimi (EN / FR / RW / SW) hejuru. Iki kiganiro nanone gisubiza mu Cyongereza, Igifaransa, Ikinyarwanda cyangwa Kiswahili.",
    sw: "Tumia kibadilishaji lugha (EN / FR / RW / SW) juu. Gumzo hili pia hujibu kwa Kiingereza, Kifaransa, Kinyarwanda, au Kiswahili.",
  },
  currency: {
    en: "All prices and fees are in Rwandan Francs (RWF).",
    fr: "Tous les prix et frais sont en francs rwandais (RWF).",
    rw: "Ibiciro n'amafaranga yose ni mu mafaranga y'u Rwanda (RWF).",
    sw: "Bei na ada zote ni kwa Faranga za Rwanda (RWF).",
  },
  minimumOrder: {
    en: "There is no special minimum order amount — add what you need to the cart. Delivery fee (5,000 RWF) applies per order to covered zones.",
    fr: "Pas de montant minimum spécial — ajoutez ce dont vous avez besoin. Frais de livraison (5 000 RWF) par commande dans les zones couvertes.",
    rw: "Nta giciro gito giteganyijwe — shyira mu gakapu ibyo ukeneye. Amafaranga yo gutanga (5,000 RWF) ku gicuruzwa cyose.",
    sw: "Hakuna kiwango cha chini maalum — weka unachohitaji kikapuni. Ada ya uwasilishaji (5,000 RWF) kwa kila agizo.",
  },
  promo: {
    en: "Promotions and flash sales appear on the home page when active. Promo codes can be validated in checkout when offered (e.g. seasonal campaigns).",
    fr: "Les promotions et ventes flash apparaissent sur l’accueil. Les codes promo peuvent être validés au paiement lorsqu’ils sont proposés.",
    rw: "Ibiciro byihariye bigaragara ku ipaji nkuru. Kode za promo zishobora kwemezwa iyo wishyura.",
    sw: "Ofa na uuzaji wa haraka huonekana kwenye ukurasa wa nyumbani. Misimbo ya ofa inaweza kuthibitishwa wakati wa kulipa.",
  },
  wishlist: {
    en: "Tap the heart on a product to save it to your Wishlist (login required). Open Wishlist from the header anytime.",
    fr: "Touchez le cœur sur un produit pour l’ajouter aux Favoris (connexion requise). Ouvrez Favoris depuis l’en-tête.",
    rw: "Kanda ku mutima ku gicuruzwa ugishyire muri Wishlist (bisaba kwinjira). Fungura Wishlist hejuru.",
    sw: "Gusa moyo kwenye bidhaa kuihifadhi Vipendwani (inahitaji kuingia). Fungua Vipendwa kutoka juu.",
  },
  invoice: {
    en: "After ordering, invoices are available from My Account (logged-in customers) or via order tracking links when provided.",
    fr: "Après commande, les factures sont dans Mon compte (clients connectés) ou via le suivi de commande.",
    rw: "Nyuma yo gutumiza, invoices ziboneka muri Konti cyangwa binyuze kuri Track Order.",
    sw: "Baada ya kuagiza, ankara zinapatikana katika Akaunti au kupitia ufuatiliaji wa agizo.",
  },

  fallback: {
    en: "Thanks! I can help with: opening hours & closing time, days we work, delivery zones/fees/ETA, payments (MoMo/Airtel — card soon), tracking (HZ-… numbers), products & prices, refunds, account, farmers portal, contact, and more. Ask in EN, FR, RW, or SW — or call +250 788 000 000.",
    fr: "Merci ! Je peux aider pour : horaires & fermeture, jours d’ouverture, livraison (zones/frais/délais), paiements (MoMo/Airtel — carte bientôt), suivi (HZ-…), produits & prix, remboursements, compte, agriculteurs, contact. EN/FR/RW/SW — ou +250 788 000 000.",
    rw: "Murakoze! Nshobora kugufasha ku: amasaha n'igifungo, iminsi dukora, gutanga, kwishyura (MoMo/Airtel — ikarita vuba), gukurikirana (HZ-…), ibicuruzwa, gusubizwa, konti, abahinzi, twandikire. EN/FR/RW/SW — cyangwa +250 788 000 000.",
    sw: "Asante! Naweza kusaidia kuhusu: saa za kufungua/kufunga, siku za kazi, uwasilishaji, malipo (MoMo/Airtel — kadi hivi karibuni), ufuatiliaji (HZ-…), bidhaa na bei, marejesho, akaunti, wakulima, mawasiliano. EN/FR/RW/SW — au +250 788 000 000.",
  },
};

type Intent = keyof typeof replies;

/** Ordered rules — more specific intents first */
const intentRules: { intent: Intent; pattern: RegExp }[] = [
  {
    intent: "greeting",
    pattern: /^(muraho|bonjour|hello|hi|hey|salut|bonsoir|habari|hujambo|salama)\b|good (morning|afternoon|evening)/,
  },
  {
    intent: "closingTime",
    pattern:
      /when.*(close|closing|shut)|close\b|closing time|fermez|fermeture|à quelle heure.*ferm|mufungura|mufunga|ryari.*funga|mnafunga|mnafunga|saa.*funga|what time.*(close|closing)/,
  },
  {
    intent: "openingTime",
    pattern:
      /when.*(open|opening)|open(ing)? time|à quelle heure.*ouvr|mufungura|ryari.*fungura|mnafungua|what time.*(open|opening)|opening hours/,
  },
  {
    intent: "weekend",
    pattern: /weekend|saturday|sunday|week-?end|samedi|dimanche|cyumweru|wa gatandatu|jumamosi|jumapili/,
  },
  {
    intent: "workDays",
    pattern:
      /how many days|days.*(work|open|week)|work(ing)? days|iminsi|jours.*(ouver|travail)|combien de jours|siku.*(kazi|wiki)|mnafanya kazi siku|7 days|seven days|monday.*sunday|every day|daily/,
  },
  {
    intent: "hours",
    pattern:
      /\bhours\b|horaire|amasaha|business hours|working hours|open daily|ouvert|mufunguye|saa za|operating hours|what time|à quelles heures/,
  },
  {
    intent: "card",
    pattern: /card|carte|ikarita|kadi|visa|mastercard|bank card|credit card|debit/,
  },
  {
    intent: "cod",
    pattern: /\bcod\b|cash on delivery|paiement à la livraison|amafaranga iyo|pesa taslimu|pay.*(rider|driver|cash)|cash payment/,
  },
  {
    intent: "momo",
    pattern: /momo|mtn|airtel|mobile money|prompt|approve.*(phone|payment)/,
  },
  {
    intent: "payment",
    pattern: /pay|payment|paiement|kwishyura|malipo|how.*(pay|payment)|methods? of payment/,
  },
  {
    intent: "deliveryFee",
    pattern:
      /delivery (fee|cost|price)|frais de livraison|amafaranga yo gutanga|ada ya uwasilishaji|how much.*(deliver|shipping)|cost.*(deliver|shipping)/,
  },
  {
    intent: "deliveryTime",
    pattern:
      /how long|delivery time|eta|arrive|minutes|combien de temps|igihe.*gutanga|muda.*uwasilishaji|when.*(arrive|get)|fast.*deliver/,
  },
  {
    intent: "delivery",
    pattern:
      /deliver|livr|gutanga|zone|coverage|uwasilishaji|shipping|where do you (deliver|ship)|do you deliver/,
  },
  {
    intent: "orderNumber",
    pattern: /order number|numéro de commande|numero y.?igicuruzwa|nambari ya agizo|hz-\d|what.*(order|number).*look/,
  },
  {
    intent: "cancelOrder",
    pattern: /cancel|annul|hagarika|ghairi|change (my )?order|modify order/,
  },
  {
    intent: "track",
    pattern: /track|suivi|gukurikirana|fuatilia|where.*(order|package)|order status/,
  },
  {
    intent: "prices",
    pattern: /price|prix|igiciro|bei|how much|combien|cost of|expensive|cheap/,
  },
  {
    intent: "currency",
    pattern: /currency|devise|rwf|franc|ifaranga|faranga|money type/,
  },
  {
    intent: "organic",
    pattern: /organic|bio|kamere|asilia|natural/,
  },
  {
    intent: "quality",
    pattern: /quality|qualité|ubwiza|ubora|fresh|inspect|safe.*food/,
  },
  {
    intent: "stock",
    pattern: /in stock|out of stock|low stock|available|availability|stock|rupture|birahari|byarangiye|imeisha/,
  },
  {
    intent: "products",
    pattern: /product|produit|ibicuruzwa|bidhaa|categor|fruit|vegetable|what do you sell|shop/,
  },
  {
    intent: "return",
    pattern: /return|refund|complaint|retour|rembours|gusubiza|rejesha|damaged|wrong item|policy/,
  },
  {
    intent: "password",
    pattern: /password|mot de passe|ijambo ry.?ibanga|nenosiri|forgot|reset login/,
  },
  {
    intent: "account",
    pattern: /account|login|register|compte|konti|akaunti|sign ?up|sign ?in|wishlist/,
  },
  {
    intent: "wishlist",
    pattern: /wishlist|favoris|byakunzwe|vipendwa|heart|save product/,
  },
  {
    intent: "farmer",
    pattern: /farmer|farm|supplier|fournisseur|umuhinzi|mkulima|portal|abahinzi|wakulima/,
  },
  {
    intent: "about",
    pattern: /about|mission|vision|youth huza|who are you|company|iki ni iki|ninyi nani/,
  },
  {
    intent: "language",
    pattern: /language|langue|ururimi|lugha|kinyarwanda|kiswahili|français|english|translate/,
  },
  {
    intent: "minimumOrder",
    pattern: /minimum|min order|commande minimum|igiciro gito|kiwango cha chini/,
  },
  {
    intent: "promo",
    pattern: /promo|discount|coupon|flash sale|offre|igiciro cyihariye|ofa/,
  },
  {
    intent: "invoice",
    pattern: /invoice|facture|invois|ankara|receipt|reçu/,
  },
  {
    intent: "contact",
    pattern: /contact|phone|whatsapp|email|call|hamagara|appeler|simu|reach you|customer service/,
  },
];

function pickIntent(lower: string): Intent {
  const text = lower.trim();
  for (const rule of intentRules) {
    if (rule.pattern.test(text)) return rule.intent;
  }
  return "fallback";
}

export function supportAutoReply(body: string, preferredLocale?: string) {
  const locale = detectLocale(body, preferredLocale);
  const intent = pickIntent(String(body || "").toLowerCase());
  return replies[intent][locale];
}

/** Exposed for tests / docs — number of distinct FAQ intents (excluding fallback) */
export function supportBotIntentCount() {
  return Object.keys(replies).filter((k) => k !== "fallback").length;
}
