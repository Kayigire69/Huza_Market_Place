import type { Locale } from "@/lib/i18n";

export type EntryCopy = {
  brand: string;
  brandHome: string;
  language: string;
  navLabel: string;
  about: string;
  contact: string;
  customerWebsite: string;
  farmersPortal: string;
  huzaFresh: string;
  heroLine1: string;
  heroLine2: string;
  story: string;
  startShopping: string;
  joinFarmer: string;
  trustQuality: string;
  trustFarmer: string;
  trustDelivery: string;
  heroImageAlt: string;
  chooseTitle: string;
  chooseSub: string;
  customerTitle: string;
  customerBody: string;
  customerB1: string;
  customerB2: string;
  customerB3: string;
  farmerTitle: string;
  farmerBody: string;
  farmerB1: string;
  farmerB2: string;
  farmerB3: string;
  scanQr: string;
  or: string;
  customerQrCaption: string;
  farmerQrCaption: string;
  openLink: string;
  stripGrow: string;
  stripStock: string;
  stripDeliver: string;
  whyTitle: string;
  whyItems: { title: string; body: string }[];
  missionTitle: string;
  missionBody: string;
  ctaTitle: string;
  ctaBody: string;
  footerAbout: string;
  quickLinks: string;
  contactTitle: string;
  socialSoon: string;
  copyright: string;
};

const en: EntryCopy = {
  brand: "Youth Huza",
  brandHome: "Youth Huza home",
  language: "Language",
  navLabel: "Main navigation",
  about: "About",
  contact: "Contact",
  customerWebsite: "Customer Website",
  farmersPortal: "Farmers Portal",
  huzaFresh: "HUZA FRESH",
  heroLine1: "Fresh produce for customers.",
  heroLine2: "Better harvests for farmers with good market price.",
  story:
    "Youth Huza helps farmers with quality crops reach the market at a good price, and connects customers with fresh produce on HUZA FRESH.",
  startShopping: "Start Shopping",
  joinFarmer: "Join as a Farmer",
  trustQuality: "Quality checked",
  trustFarmer: "Farmer support",
  trustDelivery: "Fast delivery",
  heroImageAlt: "Fresh produce at HUZA FRESH",
  chooseTitle: "How will you use Youth Huza?",
  chooseSub: "Shop fresh food, or join as a farmer.",
  customerTitle: "Customer Website",
  customerBody:
    "Shop fresh fruits, vegetables, juices, salads and seedlings. Quality checked and delivered by Youth Huza.",
  customerB1: "Inspected before sale",
  customerB2: "Delivery in Kigali, Kamonyi and Bugesera",
  customerB3: "Pay with MoMo or Airtel Money",
  farmerTitle: "Farmers Portal",
  farmerBody:
    "Get agronomy support, sell quality harvest to Youth Huza at a fair price, and grow your farm with clear payments.",
  farmerB1: "Agronomy and training",
  farmerB2: "Fair market price",
  farmerB3: "Clear quality and payments",
  scanQr: "Scan QR Code",
  or: "Or",
  customerQrCaption: "Customer Website QR",
  farmerQrCaption: "Farmers Portal QR",
  openLink: "Open link",
  stripGrow: "Better growing practices",
  stripStock: "Inspected fresh stock",
  stripDeliver: "Delivered to your door",
  whyTitle: "Why Choose Youth Huza",
  whyItems: [
    {
      title: "Fresh Produce",
      body: "Fruits, vegetables, juices and salads checked before delivery.",
    },
    {
      title: "Fair Market for Farmers",
      body: "Quality harvest reaches market at a good price through Youth Huza.",
    },
    {
      title: "Agronomy Support",
      body: "Advice and farm visits to improve produce quality.",
    },
    {
      title: "Quality Assurance",
      body: "Produce is inspected before it goes to HUZA FRESH.",
    },
    {
      title: "Fast Delivery",
      body: "Youth Huza delivers across Kigali, Kamonyi and Bugesera.",
    },
    {
      title: "Simple Digital Tools",
      body: "A clear shop for customers and a portal for farmers.",
    },
  ],
  missionTitle: "Mission",
  missionBody:
    "Help farmers bring quality harvest to market at a good price, and give customers fresh produce on HUZA FRESH.",
  ctaTitle: "Ready to Get Started?",
  ctaBody: "Shop fresh produce, or join as a farmer with Youth Huza.",
  footerAbout:
    "Youth Huza helps farmers reach market at a good price and brings fresh produce to customers on HUZA FRESH.",
  quickLinks: "Quick Links",
  contactTitle: "Contact",
  socialSoon: "Social media coming soon.",
  copyright: "Youth Huza. All rights reserved.",
};

const rw: EntryCopy = {
  brand: "Youth Huza",
  brandHome: "Ahabanza ha Youth Huza",
  language: "Ururimi",
  navLabel: "Menyu nyamukuru",
  about: "Abo turi bo",
  contact: "Twandikire",
  customerWebsite: "Iduka ry'abakiriya",
  farmersPortal: "Urubuga rw'abahinzi",
  huzaFresh: "HUZA FRESH",
  heroLine1: "Ibicuruzwa bishya ku bakiriya.",
  heroLine2: "Umusaruro mwiza ku bahinzi n'igiciro cyiza ku isoko.",
  story: "Youth Huza ifasha abahinzi n'aborozi kugeza umusaruro wabo ku isoko kugiciro cyiza",
  startShopping: "Tangira guhaha",
  joinFarmer: "Iyandikishe nk'umuhinzi",
  trustQuality: "Byagenzuwe",
  trustFarmer: "Ubufasha ku bahinzi",
  trustDelivery: "Gutanga vuba",
  heroImageAlt: "Ibicuruzwa bishya kuri HUZA FRESH",
  chooseTitle: "Ushaka gukoresha Youth Huza gute?",
  chooseSub: "Gura ibicuruzwa bishya, cyangwa wiyandikishe nk'umuhinzi.",
  customerTitle: "Iduka ry'abakiriya",
  customerBody:
    "Gura imbuto, imboga, imvubo, insalade n'ibiti. Byagenzuwe kandi bitangwa na Youth Huza.",
  customerB1: "Byagenzuwe mbere yo kugurisha",
  customerB2: "Gutanga i Kigali, Kamonyi na Bugesera",
  customerB3: "Ishyura ukoresheje MoMo cyangwa Airtel Money",
  farmerTitle: "Urubuga rw'abahinzi",
  farmerBody:
    "Bona ubufasha bw'ubuhinzi, gurisha umusaruro mwiza kuri Youth Huza ku giciro cyiza, kandi ukure umurima wawe.",
  farmerB1: "Ubujyanama n'amahugurwa",
  farmerB2: "Igiciro cyiza ku isoko",
  farmerB3: "Ubuziranenge n'ubwishyu bisobanutse",
  scanQr: "Sikana kode ya QR",
  or: "Cyangwa",
  customerQrCaption: "Kode ya QR y'iduka ry'abakiriya",
  farmerQrCaption: "Kode ya QR y'urubuga rw'abahinzi",
  openLink: "Fungura umurongo",
  stripGrow: "Imikorere myiza yo guhinga",
  stripStock: "Ububiko bwagenzuwe",
  stripDeliver: "Byageze aho utuye",
  whyTitle: "Kuki wahitamo Youth Huza",
  whyItems: [
    {
      title: "Ibicuruzwa bishya",
      body: "Imbuto, imboga, imvubo n'insalade bigenzurwa mbere yo gutanga.",
    },
    {
      title: "Isoko ryiza ku bahinzi",
      body: "Umusaruro mwiza ugera ku isoko ku giciro cyiza binyuze muri Youth Huza.",
    },
    {
      title: "Ubufasha bw'ubuhinzi",
      body: "Inama no gusura umurima kugira ngo uzamura ubuziranenge.",
    },
    {
      title: "Ubuziranenge",
      body: "Ibihingwa bigenzurwa mbere yo kugera kuri HUZA FRESH.",
    },
    {
      title: "Gutanga vuba",
      body: "Youth Huza itanga i Kigali, Kamonyi na Bugesera.",
    },
    {
      title: "Ibikoresho byoroshye",
      body: "Iduka risobanutse ku bakiriya n'urubuga ku bahinzi.",
    },
  ],
  missionTitle: "Intego",
  missionBody:
    "Gufasha abahinzi kugeza umusaruro mwiza ku isoko ku giciro cyiza, no gutanga ibicuruzwa bishya ku bakiriya kuri HUZA FRESH.",
  ctaTitle: "Witeguye gutangira?",
  ctaBody: "Gura ibicuruzwa bishya, cyangwa wiyandikishe nk'umuhinzi muri Youth Huza.",
  footerAbout:
    "Youth Huza ifasha abahinzi kugeza umusaruro ku isoko ku giciro cyiza no gutanga ibicuruzwa bishya ku bakiriya kuri HUZA FRESH.",
  quickLinks: "Amahuza yihuse",
  contactTitle: "Twandikire",
  socialSoon: "Imbuga nkoranyambaga ziza vuba.",
  copyright: "Youth Huza. Uburenganzira bwose burabitswe.",
};

const fr: EntryCopy = {
  brand: "Youth Huza",
  brandHome: "Accueil Youth Huza",
  language: "Langue",
  navLabel: "Navigation principale",
  about: "À propos",
  contact: "Contact",
  customerWebsite: "Boutique clients",
  farmersPortal: "Portail agriculteurs",
  huzaFresh: "HUZA FRESH",
  heroLine1: "Des produits frais pour les clients.",
  heroLine2: "De meilleures récoltes pour les agriculteurs, à un bon prix du marché.",
  story:
    "Youth Huza aide les agriculteurs à écouler des cultures de qualité à un bon prix, et propose des produits frais aux clients sur HUZA FRESH.",
  startShopping: "Commencer les achats",
  joinFarmer: "S'inscrire comme agriculteur",
  trustQuality: "Qualité vérifiée",
  trustFarmer: "Soutien aux agriculteurs",
  trustDelivery: "Livraison rapide",
  heroImageAlt: "Produits frais chez HUZA FRESH",
  chooseTitle: "Comment utiliser Youth Huza ?",
  chooseSub: "Achetez des produits frais, ou rejoignez-nous comme agriculteur.",
  customerTitle: "Boutique clients",
  customerBody:
    "Achetez fruits, légumes, jus, salades et plants. Qualité vérifiée et livrée par Youth Huza.",
  customerB1: "Inspecté avant la vente",
  customerB2: "Livraison à Kigali, Kamonyi et Bugesera",
  customerB3: "Payez avec MoMo ou Airtel Money",
  farmerTitle: "Portail agriculteurs",
  farmerBody:
    "Recevez un soutien agronomique, vendez une récolte de qualité à Youth Huza à un prix juste, et développez votre ferme avec des paiements clairs.",
  farmerB1: "Agronomie et formation",
  farmerB2: "Bon prix du marché",
  farmerB3: "Qualité et paiements clairs",
  scanQr: "Scanner le code QR",
  or: "Ou",
  customerQrCaption: "QR de la boutique clients",
  farmerQrCaption: "QR du portail agriculteurs",
  openLink: "Ouvrir le lien",
  stripGrow: "Meilleures pratiques agricoles",
  stripStock: "Stock frais inspecté",
  stripDeliver: "Livré chez vous",
  whyTitle: "Pourquoi choisir Youth Huza",
  whyItems: [
    {
      title: "Produits frais",
      body: "Fruits, légumes, jus et salades vérifiés avant livraison.",
    },
    {
      title: "Marché équitable pour les agriculteurs",
      body: "Une récolte de qualité atteint le marché à un bon prix via Youth Huza.",
    },
    {
      title: "Soutien agronomique",
      body: "Conseils et visites de fermes pour améliorer la qualité.",
    },
    {
      title: "Assurance qualité",
      body: "Les produits sont inspectés avant d'aller sur HUZA FRESH.",
    },
    {
      title: "Livraison rapide",
      body: "Youth Huza livre à Kigali, Kamonyi et Bugesera.",
    },
    {
      title: "Outils numériques simples",
      body: "Une boutique claire pour les clients et un portail pour les agriculteurs.",
    },
  ],
  missionTitle: "Mission",
  missionBody:
    "Aider les agriculteurs à vendre une récolte de qualité à un bon prix, et offrir des produits frais aux clients sur HUZA FRESH.",
  ctaTitle: "Prêt à commencer ?",
  ctaBody: "Achetez des produits frais, ou inscrivez-vous comme agriculteur avec Youth Huza.",
  footerAbout:
    "Youth Huza aide les agriculteurs à atteindre le marché à un bon prix et apporte des produits frais aux clients sur HUZA FRESH.",
  quickLinks: "Liens rapides",
  contactTitle: "Contact",
  socialSoon: "Réseaux sociaux bientôt disponibles.",
  copyright: "Youth Huza. Tous droits réservés.",
};

const sw: EntryCopy = {
  brand: "Youth Huza",
  brandHome: "Nyumbani ya Youth Huza",
  language: "Lugha",
  navLabel: "Menyu kuu",
  about: "Kuhusu",
  contact: "Wasiliana",
  customerWebsite: "Duka la wateja",
  farmersPortal: "Tovuti ya wakulima",
  huzaFresh: "HUZA FRESH",
  heroLine1: "Mazao safi kwa wateja.",
  heroLine2: "Mavuno bora kwa wakulima kwa bei nzuri ya soko.",
  story:
    "Youth Huza inawasaidia wakulima kufikisha mazao bora sokoni kwa bei nzuri, na kuunganisha wateja na mazao safi kwenye HUZA FRESH.",
  startShopping: "Anza kununua",
  joinFarmer: "Jiunge kama mkulima",
  trustQuality: "Ubora umehakikiwa",
  trustFarmer: "Msaada kwa wakulima",
  trustDelivery: "Uwasilishaji wa haraka",
  heroImageAlt: "Mazao safi kwenye HUZA FRESH",
  chooseTitle: "Unataka kutumia Youth Huza vipi?",
  chooseSub: "Nunua chakula safi, au jiunge kama mkulima.",
  customerTitle: "Duka la wateja",
  customerBody:
    "Nunua matunda, mboga, juisi, saladi na miche. Ubora umehakikiwa na Youth Huza inawasilisha.",
  customerB1: "Imekaguliwa kabla ya kuuzwa",
  customerB2: "Uwasilishaji Kigali, Kamonyi na Bugesera",
  customerB3: "Lipa kwa MoMo au Airtel Money",
  farmerTitle: "Tovuti ya wakulima",
  farmerBody:
    "Pata msaada wa kilimo, uza mavuno bora kwa Youth Huza kwa bei nzuri, na kukuza shamba lako kwa malipo wazi.",
  farmerB1: "Ushauri wa kilimo na mafunzo",
  farmerB2: "Bei nzuri ya soko",
  farmerB3: "Ubora na malipo wazi",
  scanQr: "Changanua msimbo wa QR",
  or: "Au",
  customerQrCaption: "QR ya duka la wateja",
  farmerQrCaption: "QR ya tovuti ya wakulima",
  openLink: "Fungua kiungo",
  stripGrow: "Mbinu bora za kulima",
  stripStock: "Hifadhi safi iliyokaguliwa",
  stripDeliver: "Inafikishwa mlangoni mwako",
  whyTitle: "Kwa nini uchague Youth Huza",
  whyItems: [
    {
      title: "Mazao safi",
      body: "Matunda, mboga, juisi na saladi zinazokaguliwa kabla ya kuwasilishwa.",
    },
    {
      title: "Soko la haki kwa wakulima",
      body: "Mavuno bora yanafika sokoni kwa bei nzuri kupitia Youth Huza.",
    },
    {
      title: "Msaada wa kilimo",
      body: "Ushauri na ziara shambani kuboresha ubora.",
    },
    {
      title: "Uhakikisho wa ubora",
      body: "Mazao yanakaguliwa kabla ya kwenda HUZA FRESH.",
    },
    {
      title: "Uwasilishaji wa haraka",
      body: "Youth Huza inawasilisha Kigali, Kamonyi na Bugesera.",
    },
    {
      title: "Zana rahisi za kidijitali",
      body: "Duka wazi kwa wateja na tovuti kwa wakulima.",
    },
  ],
  missionTitle: "Dhamira",
  missionBody:
    "Kusaidia wakulima kufikisha mavuno bora sokoni kwa bei nzuri, na kuwapa wateja mazao safi kwenye HUZA FRESH.",
  ctaTitle: "Uko tayari kuanza?",
  ctaBody: "Nunua mazao safi, au jiunge kama mkulima na Youth Huza.",
  footerAbout:
    "Youth Huza inawasaidia wakulima kufika sokoni kwa bei nzuri na kuleta mazao safi kwa wateja kwenye HUZA FRESH.",
  quickLinks: "Viungo vya haraka",
  contactTitle: "Wasiliana",
  socialSoon: "Mitandao ya kijamii inakuja hivi karibuni.",
  copyright: "Youth Huza. Haki zote zimehifadhiwa.",
};

const byLocale: Record<Locale, EntryCopy> = { en, fr, rw, sw };

export function entryCopy(locale: Locale): EntryCopy {
  return byLocale[locale] || en;
}
