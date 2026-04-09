import { useCallback } from "react";
import { Joyride, STATUS, type EventData, type Step } from "react-joyride";
import { useTranslation } from "react-i18next";

interface WalkthroughProps {
  run: boolean;
  onFinish: () => void;
}

function Walkthrough({ run, onFinish }: WalkthroughProps) {
  const { i18n } = useTranslation();
  const isHindi = i18n.language === "hi";

  const toggleLanguage = () => {
    i18n.changeLanguage(isHindi ? "en" : "hi");
  };

  const renderTitle = (text: string) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: "100%", gap: "12px" }}>
      <span style={{ flex: 1, textAlign: "left" }}>{text}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleLanguage();
        }}
        style={{
          backgroundColor: "#F5EFE0",
          color: "#A0522D",
          border: "1px solid #A0522D",
          borderRadius: "8px",
          padding: "2px 8px",
          fontFamily: "'Jost', sans-serif",
          fontWeight: 600,
          fontSize: "0.8rem",
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        {isHindi ? "EN" : "HI"}
      </button>
    </div>
  );

  const steps: Step[] = [
    {
      target: "[data-tour='brand']",
      title: renderTitle(isHindi ? "स्वागत है CraftConnect में!" : "Welcome to CraftConnect!"),
      content: isHindi
        ? "यह आपका डैशबोर्ड है। यहाँ से आप सभी सुविधाओं का उपयोग कर सकते हैं।"
        : "This is your dashboard. From here you can access all features of the platform.",
      placement: "right",
      skipBeacon: true,
    },
    {
      target: "[data-tour='mode-switcher']",
      title: renderTitle(isHindi ? "मोड स्विचर" : "Mode Switcher"),
      content: isHindi
        ? "आप Artisan, Customer या Learner के रूप में अपना मोड बदल सकते हैं।"
        : "Switch between your Artisan, Customer, and Learner modes to access different features.",
      placement: "bottom",
      skipBeacon: true,
    },
    {
      target: "[data-tour='nav-products']",
      title: renderTitle(isHindi ? "उत्पाद" : "Products"),
      content: isHindi
        ? "यहाँ हस्तशिल्प उत्पादों को ब्राउज़ या प्रबंधित करें।"
        : "Browse handcrafted products or manage your own listings.",
      placement: "right",
      skipBeacon: true,
    },
    {
      target: "[data-tour='nav-courses']",
      title: renderTitle(isHindi ? "पाठ्यक्रम" : "Courses"),
      content: isHindi
        ? "शिल्पकला सीखें या अपने पाठ्यक्रम बनाएं और साझा करें।"
        : "Learn traditional crafts or create and share your own courses.",
      placement: "right",
      skipBeacon: true,
    },
    {
      target: "[data-tour='nav-messages']",
      title: renderTitle(isHindi ? "संदेश" : "Messages"),
      content: isHindi
        ? "कारीगरों और ग्राहकों के साथ सीधे बातचीत करें।"
        : "Chat directly with artisans and customers in real time.",
      placement: "right",
      skipBeacon: true,
    },
    {
      target: "[data-tour='wishlist-btn']",
      title: renderTitle(isHindi ? "इच्छा सूची" : "Wishlist"),
      content: isHindi
        ? "अपने पसंदीदा उत्पाद यहाँ सहेजें।"
        : "Save your favourite products to your wishlist for later.",
      placement: "bottom",
      skipBeacon: true,
    },
    {
      target: "[data-tour='notifications-btn']",
      title: renderTitle(isHindi ? "सूचनाएं" : "Notifications"),
      content: isHindi
        ? "अपने ऑर्डर, संदेश और सिस्टम अपडेट यहाँ देखें।"
        : "Stay updated with orders, messages, and system alerts.",
      placement: "bottom",
      skipBeacon: true,
    },
    {
      target: "[data-tour='replay-btn']",
      title: renderTitle(isHindi ? "सहायता" : "Help"),
      content: isHindi
        ? "इस बटन पर क्लिक करके आप कभी भी इस tour को दोबारा देख सकते हैं।"
        : "Click this button at any time to replay this walkthrough.",
      placement: "bottom",
      skipBeacon: true,
    },
  ];

  const handleEvent = useCallback(
    (data: EventData) => {
      const { status } = data;
      if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
        onFinish();
      }
    },
    [onFinish]
  );

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      scrollToFirstStep
      onEvent={handleEvent}
      options={{
        primaryColor: "#A0522D",
        backgroundColor: "#F5EFE0",
        textColor: "#2B2017",
        overlayColor: "rgba(43, 32, 23, 0.55)",
        zIndex: 10000,
        showProgress: true,
        buttons: ["back", "primary", "skip"],
        spotlightRadius: 12,
      }}
      styles={{
        tooltip: {
          borderRadius: "12px",
          boxShadow: "0 12px 32px -4px rgba(43, 32, 23, 0.18)",
        },
        tooltipTitle: {
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "1.2rem",
          fontWeight: 700,
          color: "#A0522D",
        },
        tooltipContent: {
          fontFamily: "'Lora', serif",
          fontSize: "0.9rem",
          lineHeight: 1.6,
        },
        buttonPrimary: {
          backgroundColor: "#A0522D",
          fontFamily: "'Jost', sans-serif",
          fontWeight: 600,
          fontSize: "0.8rem",
          letterSpacing: "0.08em",
          borderRadius: "8px",
          padding: "8px 18px",
        },
        buttonBack: {
          color: "#A0522D",
          fontFamily: "'Jost', sans-serif",
          fontWeight: 600,
          fontSize: "0.8rem",
        },
        buttonSkip: {
          color: "#636b2f",
          fontFamily: "'Jost', sans-serif",
          fontSize: "0.78rem",
        },
      }}
      locale={{
        back: isHindi ? "पीछे" : "Back",
        close: isHindi ? "बंद करें" : "Close",
        last: isHindi ? "समाप्त करें" : "Finish",
        next: isHindi ? "अगला" : "Next",
        skip: isHindi ? "छोड़ें" : "Skip Tour",
        open: isHindi ? "खोलें" : "Open",
      }}
    />
  );
}

export default Walkthrough;
