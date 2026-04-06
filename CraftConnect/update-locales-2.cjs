const fs = require("fs");

function updateLocales() {
  const enPath = "./src/locales/en.json";
  const hiPath = "./src/locales/hi.json";

  const en = JSON.parse(fs.readFileSync(enPath, "utf8"));
  const hi = JSON.parse(fs.readFileSync(hiPath, "utf8"));

  const newKeys = {
    continue: ["Continue", "जारी रखें"],
    masterArtisan: ["Master Artisan", "मास्टर कारीगर"],
    noReviews: ["No Reviews", "कोई समीक्षा नहीं"],
    cannotChatWithSelf: ["You cannot start a chat with yourself.", "आप स्वयं से चैट प्रारंभ नहीं कर सकते।"],
    loading: ["Loading...", "लोड हो रहा है..."],
    artisanNotFound: ["Artisan not found.", "कारीगर नहीं मिला।"],
    goBack: ["Go Back", "वापस जाएं"],
    chatWithArtisan: ["Chat with Artisan", "कारीगर से चैट करें"],
    editRating: ["Edit Rating", "रेटिंग संपादित करें"],
    rateArtisan: ["Rate Artisan", "कारीगर को रेट करें"],
    noDescriptionProvided: ["This artisan has not provided a description yet.", "इस कारीगर ने अभी तक कोई विवरण नहीं दिया है।"],
    localArtist: ["Local Artist", "स्थानीय कलाकार"],
    notSpecified: ["Not Specified", "निर्दिष्ट नहीं है"],
    verifiedSeller: ["Verified Seller", "सत्यापित विक्रेता"],
    industryLabel: ["Industry", "उद्योग"],
    experienceLabel: ["Experience", "अनुभव"],
    locationLabel: ["Location", "स्थान"],
    authenticityLabel: ["Authenticity", "प्रमाणिकता"],
    availableWorks: ["Available hand-sculpted works", "उपलब्ध हस्तशिल्प कार्य"],
    exploreCollection: ["Explore Full Collection", "पूरा संग्रह देखें"],
    handcrafted: ["Handcrafted", "हस्तशिल्प"],
    coursesOfferedByArtisan: ["Courses offered by this artisan", "इस कारीगर द्वारा प्रस्तावित पाठ्यक्रम"],
    lessons: ["lessons", "पाठ"],
    writeReview: ["Write a Review", "समीक्षा लिखें"],
    editYourReview: ["Edit Your Review", "अपनी समीक्षा संपादित करें"],
    noReviewsYet: ["No reviews yet. Be the first to review this artisan!", "अभी तक कोई समीक्षा नहीं। इस कारीगर की समीक्षा करने वाले पहले व्यक्ति बनें!"],
    duration: ["Duration", "अवधि"]
  };

  for (const [key, [enVal, hiVal]] of Object.entries(newKeys)) {
    en.extended[key] = enVal;
    hi.extended[key] = hiVal;
  }

  fs.writeFileSync(enPath, JSON.stringify(en, null, 2));
  fs.writeFileSync(hiPath, JSON.stringify(hi, null, 2));
  console.log("Updated locales Phase 2!");
}

updateLocales();
