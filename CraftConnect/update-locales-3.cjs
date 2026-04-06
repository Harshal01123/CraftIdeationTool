const fs = require("fs");

function updateLocales() {
  const enPath = "./src/locales/en.json";
  const hiPath = "./src/locales/hi.json";

  const en = JSON.parse(fs.readFileSync(enPath, "utf8"));
  const hi = JSON.parse(fs.readFileSync(hiPath, "utf8"));

  const newKeys = {
    instructor: ["Instructor", "प्रशिक्षक"],
    viewCourse: ["View Course", "कोर्स देखें"],
    unknown: ["Unknown", "अज्ञात"],
    hoursShort: ["h", "घंटे"],
    minsShort: ["m", "मिनट"],
    noReviews: ["No Reviews", "कोई समीक्षा नहीं"],
    noReviewsLower: ["No reviews", "कोई समीक्षा नहीं"],
    showLess: ["Show Less", "कम दिखाएं"],
    viewAll: ["View All", "सभी देखें"],
    emptyCourses: ["No courses found matching your criteria.", "आपके मानदंड से मेल खाने वाला कोई कोर्स नहीं मिला।"]
  };

  for (const [key, [enVal, hiVal]] of Object.entries(newKeys)) {
    en.extended[key] = enVal;
    hi.extended[key] = hiVal;
  }

  fs.writeFileSync(enPath, JSON.stringify(en, null, 2));
  fs.writeFileSync(hiPath, JSON.stringify(hi, null, 2));
  console.log("Updated locales Phase 3!");
}

updateLocales();
