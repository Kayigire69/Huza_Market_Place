type Locale = "en" | "fr" | "rw";

function detectLocale(text: string, preferred?: string): Locale {
  if (preferred === "fr" || preferred === "rw" || preferred === "en") return preferred;
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
  return "en";
}

const replies: Record<string, Record<Locale, string>> = {
  greeting: {
    en: "Hello! Welcome to HUZA MARKETPLACE by Youth Huza. Ask about products, orders, delivery, payments, tracking, returns, or your account.",
    fr: "Bonjour ! Bienvenue sur HUZA MARKETPLACE par Youth Huza. Posez vos questions sur les produits, commandes, livraison, paiements, suivi, retours ou votre compte.",
    rw: "Muraho! Murakaza neza kuri HUZA MARKETPLACE ya Youth Huza. Baza ibibazo ku bicuruzwa, ibicuruzwa byatumijwe, gutanga, kwishyura, gukurikirana, gusubiza cyangwa konti yawe.",
  },
  track: {
    en: "To track an order: open Track Order, enter your order number (e.g. HUZA-…) and the phone used at checkout. You see the order number on the payment success screen and in My Account → Orders. Save it to track anytime.",
    fr: "Pour suivre une commande : ouvrez Suivi de commande, entrez votre numéro (ex. HUZA-…) et le téléphone utilisé au paiement. Le numéro apparaît après paiement et dans Mon compte → Commandes.",
    rw: "Kugira ngo ukurikirane igicuruzwa: fungura Track Order, andika numero y'igicuruzwa (urugero HUZA-…) n'telefone wakoresheje. Numero iboneka nyuma yo kwishyura no muri Konti → Ibicuruzwa.",
  },
  payment: {
    en: "You pay Youth Huza with MTN MoMo, Airtel Money, or Cash on Delivery. After checkout, approve the MoMo/Airtel prompt on your phone (or pay the rider for COD). Card payments are coming soon.",
    fr: "Vous payez Youth Huza via MTN MoMo, Airtel Money ou paiement à la livraison. Après la commande, approuvez l’invite MoMo/Airtel sur votre téléphone (ou payez le livreur pour COD).",
    rw: "Wishyura Youth Huza ukoresheje MTN MoMo, Airtel Money cyangwa amafaranga iyo bagutegereje. Nyuma yo gutumiza, emera ubutumire bwa MoMo/Airtel kuri telefoni yawe.",
  },
  delivery: {
    en: "Youth Huza delivers directly: Kigali 2,000 RWF (~45 min), Kamonyi/Ruyenzi 3,000 RWF, Bugesera/Nyamata 3,000 RWF. At checkout choose Today, Tomorrow, or Scheduled delivery and share your live location or typed address.",
    fr: "Youth Huza livre directement : Kigali 2 000 RWF (~45 min), Kamonyi/Ruyenzi 3 000 RWF, Bugesera/Nyamata 3 000 RWF. Choisissez Aujourd’hui, Demain ou Planifié et partagez votre position ou adresse.",
    rw: "Youth Huza itanga ubwayo: Kigali 2,000 RWF (~iminota 45), Kamonyi/Ruyenzi 3,000 RWF, Bugesera/Nyamata 3,000 RWF. Hitamo Uyu munsi, Ejo cyangwa Iteganyijwe hanyuma ushyire aho uri cyangwa aderesi.",
  },
  products: {
    en: "Browse Products or Categories (fruits, vegetables, dairy, meat, and more). Prices are set by Youth Huza. Use search for name, category, price, stock, new arrivals, or best sellers.",
    fr: "Parcourez Produits ou Catégories (fruits, légumes, laitiers, viande…). Les prix sont fixés par Youth Huza. Cherchez par nom, catégorie, prix, stock, nouveautés ou meilleures ventes.",
    rw: "Reba Ibicuruzwa cyangwa Ibyiciro (imbuto, imboga, amata, inyama…). Ibiciro bishyirwaho na Youth Huza. Shakisha izina, icyiciro, igiciro, ububiko, bishya cyangwa bikunda.",
  },
  hours: {
    en: "We are open daily 6:00 AM – 9:00 PM. Outside hours you can still browse and schedule delivery for the next business day.",
    fr: "Ouvert tous les jours de 6h00 à 21h00. Hors horaires, vous pouvez parcourir et planifier pour le prochain jour ouvrable.",
    rw: "Dufungura buri munsi saa 12 – saa 3 z'ijoro. Iyo turafunze urashobora gukomeza ureba no guteganya umunsi ukurikira.",
  },
  return: {
    en: "For returns, refunds, or complaints open Support Center (/support) and create a ticket, or tell us your order number here. We also have WhatsApp and FAQ pages.",
    fr: "Pour retours, remboursements ou plaintes, ouvrez le Centre d’assistance (/support) et créez un ticket, ou donnez-nous votre numéro de commande ici.",
    rw: "Kugira ngo usubize, usubizwe amafaranga cyangwa wicare ikibazo, fungura Support (/support) hanyuma ukore ticket, cyangwa utange numero y'igicuruzwa hano.",
  },
  account: {
    en: "Register or log in to see Orders, Wishlist, Addresses, Notifications, and Invoices. Guests can still checkout and track with order number + phone.",
    fr: "Inscrivez-vous ou connectez-vous pour voir Commandes, Favoris, Adresses, Notifications et Factures. Les invités peuvent commander et suivre avec numéro + téléphone.",
    rw: "Iyandikishe cyangwa winjire urebe Ibicuruzwa, Wishlist, Aderesi, Amakuru n'Invoices. Abashyitsi barashobora gutumiza no gukurikirana bakoresheje numero n'telefone.",
  },
  supplier: {
    en: "Farms sell produce to Youth Huza via the Supplier Procurement Portal (/supplier)—not to customers. Customers only buy from HUZA MARKETPLACE.",
    fr: "Les fermes vendent à Youth Huza via le Portail d’approvisionnement (/supplier)—pas aux clients. Les clients achètent uniquement sur HUZA MARKETPLACE.",
    rw: "Abahinzi bagurisha kuri Youth Huza binyuze ku Supplier Portal (/supplier)—si ku bakiriya. Abakiriya bagura gusa kuri HUZA MARKETPLACE.",
  },
  contact: {
    en: "Contact Youth Huza: +250 788 000 000 · hello@youthhuza.rw · WhatsApp available from the footer. Or keep chatting here.",
    fr: "Contact Youth Huza : +250 788 000 000 · hello@youthhuza.rw · WhatsApp via le pied de page. Ou continuez ici.",
    rw: "Twandikire Youth Huza: +250 788 000 000 · hello@youthhuza.rw · WhatsApp kuri footer. Cyangwa ukomeze hano.",
  },
  fallback: {
    en: "Thanks for your message. I can help with products, prices, delivery zones/fees, payments (MoMo/Airtel/COD), order tracking (need your HUZA-… number), returns, hours, and accounts. Ask in English, French, or Kinyarwanda — or call +250 788 000 000.",
    fr: "Merci. Je peux aider pour produits, prix, zones/frais de livraison, paiements (MoMo/Airtel/COD), suivi (numéro HUZA-…), retours, horaires et comptes. Posez votre question en français, anglais ou kinyarwanda — ou appelez +250 788 000 000.",
    rw: "Murakoze. Nshobora kugufasha ku bicuruzwa, ibiciro, gutanga, kwishyura (MoMo/Airtel/COD), gukurikirana (numero HUZA-…), gusubiza, amasaha n'konti. Baza mu Cyongereza, Igifaransa cyangwa Ikinyarwanda — cyangwa hamagara +250 788 000 000.",
  },
};

function pickIntent(lower: string): keyof typeof replies {
  if (/muraho|bonjour|hello|hi\b|hey|salut|bonsoir/.test(lower)) return "greeting";
  if (/track|order number|suivi|commande|gukurikirana|numero|huza-/.test(lower)) return "track";
  if (/pay|momo|airtel|payment|paiement|kwishyura|cash|cod|card/.test(lower)) return "payment";
  if (/deliver|livr|gutanga|zone|fee|frais|coverage/.test(lower)) return "delivery";
  if (/product|price|prix|igiciro|ibicuruzwa|category|fruit|vegetable|stock/.test(lower))
    return "products";
  if (/hour|ouvert|amasaha|closed|horaire|open/.test(lower)) return "hours";
  if (/return|refund|complaint|retour|rembours|gusubiza|ikibazo|ticket/.test(lower))
    return "return";
  if (/account|login|register|compte|konti|password|wishlist/.test(lower)) return "account";
  if (/supplier|farm|fournisseur|umuhinzi|procurement|portal/.test(lower)) return "supplier";
  if (/contact|phone|whatsapp|email|call|hamagara|appeler/.test(lower)) return "contact";
  return "fallback";
}

export function supportAutoReply(body: string, preferredLocale?: string) {
  const locale = detectLocale(body, preferredLocale);
  const intent = pickIntent(String(body || "").toLowerCase());
  return replies[intent][locale];
}
