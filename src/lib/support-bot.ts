type Locale = "en" | "fr" | "rw" | "sw";

function detectLocale(text: string, preferred?: string): Locale {
  if (preferred === "fr" || preferred === "rw" || preferred === "en" || preferred === "sw") {
    return preferred;
  }
  const t = text.toLowerCase();
  if (
    /\b(bonjour|merci|commande|livraison|paiement|produit|prix|compte)\b/.test(t) ||
    /\b(je |vous |où |comment )\b/.test(t)
  ) {
    return "fr";
  }
  if (
    /\b(muraho|murakoze|igicuruzwa|gutanga|kwishyura|igiciro|konti|amakuru)\b/.test(t) ||
    /\b(ese |nihe |gute )\b/.test(t)
  ) {
    return "rw";
  }
  if (
    /\b(habari|asante|bidhaa|agizo|uwasilishaji|malipo|bei|akaunti|karibu)\b/.test(t) ||
    /\b(ninaweza|tafadhali|sasa )\b/.test(t)
  ) {
    return "sw";
  }
  return "en";
}

const replies: Record<string, Record<Locale, string>> = {
  greeting: {
    en: "Hello! Welcome to HUZA FRESH by Youth Huza. Ask about products, orders, delivery, payments, tracking, returns, or your account.",
    fr: "Bonjour ! Bienvenue sur HUZA FRESH par Youth Huza. Posez vos questions sur les produits, commandes, livraison, paiements, suivi, retours ou votre compte.",
    rw: "Muraho! Murakaza neza kuri HUZA FRESH ya Youth Huza. Baza ibibazo ku bicuruzwa, ibicuruzwa byatumijwe, gutanga, kwishyura, gukurikirana, gusubiza cyangwa konti yawe.",
    sw: "Habari! Karibu HUZA FRESH ya Youth Huza. Uliza kuhusu bidhaa, maagizo, uwasilishaji, malipo, ufuatiliaji, marejesho, au akaunti yako.",
  },
  track: {
    en: "To track an order: open Track Order, enter your order number (e.g. HUZA-…) and the phone used at checkout. You see the order number on the payment success screen and in My Account → Orders. Save it to track anytime.",
    fr: "Pour suivre une commande : ouvrez Suivi de commande, entrez votre numéro (ex. HUZA-…) et le téléphone utilisé au paiement. Le numéro apparaît après paiement et dans Mon compte → Commandes.",
    rw: "Kugira ngo ukurikirane igicuruzwa: fungura Track Order, andika numero y'igicuruzwa (urugero HUZA-…) n'telefone wakoresheje. Numero iboneka nyuma yo kwishyura no muri Konti → Ibicuruzwa.",
    sw: "Kufuatilia agizo: fungua Track Order, weka nambari ya agizo (mfano HUZA-…) na simu uliyotumia kulipa. Nambari inaonekana baada ya malipo na katika Akaunti → Maagizo.",
  },
  payment: {
    en: "You pay Youth Huza with MTN MoMo, Airtel Money, or Cash on Delivery. After checkout, approve the MoMo/Airtel prompt on your phone (or pay the rider for COD). Card payments are coming soon.",
    fr: "Vous payez Youth Huza via MTN MoMo, Airtel Money ou paiement à la livraison. Après la commande, approuvez l’invite MoMo/Airtel sur votre téléphone (ou payez le livreur pour COD).",
    rw: "Wishyura Youth Huza ukoresheje MTN MoMo, Airtel Money cyangwa amafaranga iyo bagutegereje. Nyuma yo gutumiza, emera ubutumire bwa MoMo/Airtel kuri telefoni yawe.",
    sw: "Unalipa Youth Huza kwa MTN MoMo, Airtel Money, au pesa taslimu wakati wa uwasilishaji. Baada ya kuagiza, idhinisha ombi la MoMo/Airtel kwenye simu yako.",
  },
  delivery: {
    en: "Youth Huza delivers to Kigali, Kamonyi (Ruyenzi), and Bugesera (Nyamata) for a flat 5,000 RWF fee. At checkout choose Today, Tomorrow, or Scheduled delivery and share your live location or typed address.",
    fr: "Youth Huza livre à Kigali, Kamonyi (Ruyenzi) et Bugesera (Nyamata) pour un tarif unique de 5 000 RWF. Choisissez Aujourd’hui, Demain ou Planifié et partagez votre position ou adresse.",
    rw: "Youth Huza itanga i Kigali, Kamonyi (Ruyenzi), na Bugesera (Nyamata) ku giciro kimwe cya 5,000 RWF. Hitamo Uyu munsi, Ejo cyangwa Iteganyijwe hanyuma ushyire aho uri cyangwa aderesi.",
    sw: "Youth Huza inawasilisha Kigali, Kamonyi (Ruyenzi), na Bugesera (Nyamata) kwa ada ya 5,000 RWF. Wakati wa kulipa chagua Leo, Kesho, au Ratiba, kisha shiriki eneo lako au anwani.",
  },
  products: {
    en: "Browse Products or Categories (fruits, vegetables, dairy, meat, and more). Prices are set by Youth Huza. Use search for name, category, price, stock, new arrivals, or best sellers.",
    fr: "Parcourez Produits ou Catégories (fruits, légumes, laitiers, viande…). Les prix sont fixés par Youth Huza. Cherchez par nom, catégorie, prix, stock, nouveautés ou meilleures ventes.",
    rw: "Reba Ibicuruzwa cyangwa Ibyiciro (imbuto, imboga, amata, inyama…). Ibiciro bishyirwaho na Youth Huza. Shakisha izina, icyiciro, igiciro, ububiko, bishya cyangwa bikunda.",
    sw: "Vinjari Bidhaa au Kategoria (matunda, mboga, maziwa, nyama…). Bei huwekwa na Youth Huza. Tumia utafutaji kwa jina, kategoria, bei, hisa, mpya, au zinazouzwa zaidi.",
  },
  hours: {
    en: "We are open daily 6:00 AM – 9:00 PM. Outside hours you can still browse and schedule delivery for the next business day.",
    fr: "Ouvert tous les jours de 6h00 à 21h00. Hors horaires, vous pouvez parcourir et planifier pour le prochain jour ouvrable.",
    rw: "Dufungura buri munsi saa 12 – saa 3 z'ijoro. Iyo turafunze urashobora gukomeza ureba no guteganya umunsi ukurikira.",
    sw: "Tuko wazi kila siku saa 12 asubuhi – saa 3 usiku. Nje ya saa hizo bado unaweza kuvinjari na kupanga uwasilishaji kwa siku inayofuata.",
  },
  return: {
    en: "For returns, refunds, or complaints open Support Center (/support) and create a ticket, or tell us your order number here. We also have WhatsApp and FAQ pages.",
    fr: "Pour retours, remboursements ou plaintes, ouvrez le Centre d’assistance (/support) et créez un ticket, ou donnez-nous votre numéro de commande ici.",
    rw: "Kugira ngo usubize, usubizwe amafaranga cyangwa wicare ikibazo, fungura Support (/support) hanyuma ukore ticket, cyangwa utange numero y'igicuruzwa hano.",
    sw: "Kwa marejesho, kurejeshewa pesa, au malalamiko fungua Support (/support) na unda tiketi, au tupe nambari ya agizo hapa. Pia kuna WhatsApp na FAQ.",
  },
  account: {
    en: "Register or log in to see Orders, Wishlist, Addresses, Notifications, and Invoices. Guests can still checkout and track with order number + phone.",
    fr: "Inscrivez-vous ou connectez-vous pour voir Commandes, Favoris, Adresses, Notifications et Factures. Les invités peuvent commander et suivre avec numéro + téléphone.",
    rw: "Iyandikishe cyangwa winjire urebe Ibicuruzwa, Wishlist, Aderesi, Amakuru n'Invoices. Abashyitsi barashobora gutumiza no gukurikirana bakoresheje numero n'telefone.",
    sw: "Jisajili au ingia kuona Maagizo, Vipendwa, Anwani, Arifa, na Ankara. Wageni bado wanaweza kuagiza na kufuatilia kwa nambari ya agizo + simu.",
  },
  supplier: {
    en: "Farms register on the Farmers Portal (/farmer). Huza field agents visit farms to help registration and review products with photos. Huza does not place online purchase orders to farmers — agents work with farms on the ground. Customers only buy from HUZA FRESH.",
    fr: "Les fermes s’inscrivent sur le Portail agriculteurs (/farmer). Des agents Huza visitent les fermes pour aider à l’inscription et revoir les produits avec photos. Huza ne passe pas de commandes en ligne aux fermiers. Les clients achètent uniquement sur HUZA FRESH.",
    rw: "Abahinzi biyandikisha kuri Farmers Portal (/farmer). Abakozi ba Huza basura abahinzi babafasha kwiyandikisha no kureba ibicuruzwa n'amafoto. Huza ntabwo itumiza online ku bahinzi. Abakiriya bagura gusa kuri HUZA FRESH.",
    sw: "Wakulima wanajisajili kwenye Tovuti ya Wakulima (/farmer). Mawakala wa Huza hutembelea mashamba kusaidia usajili na kukagua bidhaa pamoja na picha. Wateja hununua tu kutoka HUZA FRESH.",
  },
  contact: {
    en: "Contact Youth Huza: +250 788 000 000 · hello@youthhuza.rw · WhatsApp available from the footer. Or keep chatting here.",
    fr: "Contact Youth Huza : +250 788 000 000 · hello@youthhuza.rw · WhatsApp via le pied de page. Ou continuez ici.",
    rw: "Twandikire Youth Huza: +250 788 000 000 · hello@youthhuza.rw · WhatsApp kuri footer. Cyangwa ukomeze hano.",
    sw: "Wasiliana na Youth Huza: +250 788 000 000 · hello@youthhuza.rw · WhatsApp kupitia footer. Au endelea kuzungumza hapa.",
  },
  fallback: {
    en: "Thanks for your message. I can help with products, prices, delivery zones/fees, payments (MoMo/Airtel/COD), order tracking (need your HUZA-… number), returns, hours, and accounts. Ask in English, French, Kinyarwanda, or Kiswahili — or call +250 788 000 000.",
    fr: "Merci. Je peux aider pour produits, prix, zones/frais de livraison, paiements (MoMo/Airtel/COD), suivi (numéro HUZA-…), retours, horaires et comptes. Posez votre question en français, anglais, kinyarwanda ou kiswahili — ou appelez +250 788 000 000.",
    rw: "Murakoze. Nshobora kugufasha ku bicuruzwa, ibiciro, gutanga, kwishyura (MoMo/Airtel/COD), gukurikirana (numero HUZA-…), gusubiza, amasaha n'konti. Baza mu Cyongereza, Igifaransa, Ikinyarwanda cyangwa Kiswahili — cyangwa hamagara +250 788 000 000.",
    sw: "Asante kwa ujumbe wako. Naweza kusaidia kuhusu bidhaa, bei, maeneo/ada za uwasilishaji, malipo (MoMo/Airtel/COD), ufuatiliaji (nambari HUZA-…), marejesho, saa, na akaunti. Uliza kwa Kiingereza, Kifaransa, Kinyarwanda, au Kiswahili — au piga +250 788 000 000.",
  },
};

function pickIntent(lower: string): keyof typeof replies {
  if (/muraho|bonjour|hello|hi\b|hey|salut|bonsoir|habari|hujambo|salama/.test(lower))
    return "greeting";
  if (/track|order number|suivi|commande|gukurikirana|numero|huza-|agizo|fuatilia/.test(lower))
    return "track";
  if (/pay|momo|airtel|payment|paiement|kwishyura|cash|cod|card|malipo/.test(lower))
    return "payment";
  if (/deliver|livr|gutanga|zone|fee|frais|coverage|uwasilishaji/.test(lower)) return "delivery";
  if (/product|price|prix|igiciro|ibicuruzwa|category|fruit|vegetable|stock|bidhaa|bei/.test(lower))
    return "products";
  if (/hour|ouvert|amasaha|closed|horaire|open|saa/.test(lower)) return "hours";
  if (/return|refund|complaint|retour|rembours|gusubiza|ikibazo|ticket|rejesha/.test(lower))
    return "return";
  if (/account|login|register|compte|konti|password|wishlist|akaunti/.test(lower)) return "account";
  if (/supplier|farm|fournisseur|umuhinzi|procurement|portal|mkulima/.test(lower)) return "supplier";
  if (/contact|phone|whatsapp|email|call|hamagara|appeler|simu/.test(lower)) return "contact";
  return "fallback";
}

export function supportAutoReply(body: string, preferredLocale?: string) {
  const locale = detectLocale(body, preferredLocale);
  const intent = pickIntent(String(body || "").toLowerCase());
  return replies[intent][locale];
}
