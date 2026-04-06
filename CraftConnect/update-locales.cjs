const fs = require("fs");

function updateLocales() {
  const enPath = "./src/locales/en.json";
  const hiPath = "./src/locales/hi.json";

  const en = JSON.parse(fs.readFileSync(enPath, "utf8"));
  const hi = JSON.parse(fs.readFileSync(hiPath, "utf8"));

  const newKeys = {
    noProducts: ["No products found for this artisan.", "इस कारीगर के लिए कोई उत्पाद नहीं मिला।"],
    status_pending: ["Awaiting Response", "प्रतिक्रिया की प्रतीक्षा में"],
    status_accepted: ["Accepted", "स्वीकृत"],
    status_rejected: ["Rejected", "अस्वीकृत"],
    status_countered: ["Countered", "काउंटर किया गया"],
    yourOffer: ["Your offer:", "आपका प्रस्ताव:"],
    offer: ["Offer:", "प्रस्ताव:"],
    bargain: ["Bargain", "भाव-तोल करें"],
    counterAgain: ["Counter Again", "फिर से काउंटर करें"],
    yourOfferPrice: ["Your Offer Price (₹)", "आपके प्रस्ताव की कीमत (₹)"],
    enterPrice: ["Enter your price...", "अपनी कीमत दर्ज करें..."],
    offerAboveListed: ["💡 Your offer is above listed price — great for the artisan!", "💡 आपका प्रस्ताव सूची कीमत से अधिक है — कारीगर के लिए बहुत अच्छा!"],
    offerBelow50: ["⚠️ Your offer is less than 50% of the listed price.", "⚠️ आपका प्रस्ताव सूची कीमत के 50% से कम है।"],
    sending: ["Sending...", "भेजा जा रहा है..."],
    sendOffer: ["Send Offer", "प्रस्ताव भेजें"],
    listedAt: ["Listed at", "सूचीबद्ध कीमत"]
  };

  for (const [key, [enVal, hiVal]] of Object.entries(newKeys)) {
    en.extended[key] = enVal;
    hi.extended[key] = hiVal;
  }

  fs.writeFileSync(enPath, JSON.stringify(en, null, 2));
  fs.writeFileSync(hiPath, JSON.stringify(hi, null, 2));
  console.log("Updated locales!");
}

updateLocales();
