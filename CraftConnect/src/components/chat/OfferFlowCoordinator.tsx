import { useState, useEffect } from "react";
import type { Profile, Product } from "../../types/chat";
import { useTranslation } from "react-i18next";
import ArtisanProductPicker from "./ArtisanProductPicker";
import PriceSetDialog from "./PriceSetDialog";
import { startProductConversation, startConversation } from "../../lib/chatUtils";
import { useAuth } from "../../hooks/useAuth";
import styles from "./ContactDialog.module.css";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  artisan: Profile | null;
  product?: Product | null;
  onConversationStarted: (conversationId: string) => void;
}

type Step = "title" | "product" | "price";

export default function OfferFlowCoordinator({
  isOpen,
  onClose,
  artisan,
  product,
  onConversationStarted,
}: Props) {
  const { t } = useTranslation();
  const { profile: currentProfile } = useAuth();
  const [step, setStep] = useState<Step>("title");
  const [title, setTitle] = useState("");
  const [processing, setProcessing] = useState(false);
  const isOffer = !!product;

  useEffect(() => {
    if (isOpen) {
      setStep("title");
      setTitle("");
    }
  }, [isOpen, product]);

  if (!isOpen || !artisan || !currentProfile) return null;

  async function handlePriceSubmit(price: number) {
    if (!product || !currentProfile || !artisan) return;
    setProcessing(true);
    const result = await startProductConversation({
      customerId: currentProfile.id,
      artisanId: artisan.id,
      title: title.trim(),
      payload: {
        productId: product.id,
        productName: product.name,
        imageUrl: product.image_url,
        listedPrice: product.price,
        offeredPrice: price,
      },
    });
    setProcessing(false);
    if (result.error) {
      alert(result.error);
      return;
    }
    onConversationStarted(result.conversationId!);
    onClose();
  }

  async function handleProductPickerSubmit(pickedProduct: Product, price: number) {
    if (!currentProfile || !artisan) return;
    setProcessing(true);
    const result = await startProductConversation({
      customerId: currentProfile.id,
      artisanId: artisan.id,
      title: title.trim(),
      payload: {
        productId: pickedProduct.id,
        productName: pickedProduct.name,
        imageUrl: pickedProduct.image_url,
        listedPrice: pickedProduct.price,
        offeredPrice: price,
      },
    });
    setProcessing(false);
    if (result.error) {
      alert(result.error);
      return;
    }
    onConversationStarted(result.conversationId!);
    onClose();
  }

  if (step === "title") {
    return (
      <div className={styles.dialogOverlay}>
        <div className={styles.dialog}>
          <h3 className={styles.dialogTitle}>
            {isOffer ? t("extended.startOffer") : t("extended.newConversation")}
          </h3>
          <p className={styles.dialogSubtitle}>
            {isOffer ? t("extended.whatIsOfferRegarding") : t("extended.whatIsConversationRegarding")}
          </p>
          <input
            className={styles.dialogInput}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && title.trim()) {
                setStep(product ? "price" : "product");
              }
            }}
            placeholder="e.g. Custom pottery order"
            autoFocus
          />
          <div className={styles.dialogActions}>
            <button className={styles.cancelBtn} onClick={onClose} disabled={processing}>
              {t("extended.cancel")}
            </button>
            <button
              className={styles.confirmBtn}
              onClick={() => setStep(product ? "price" : "product")}
              disabled={!title.trim() || processing}
            >
              {t("extended.continue")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "product") {
    return (
      <div className={styles.dialogOverlay} onClick={onClose}>
        <div
          className={styles.dialog}
          onClick={(e) => e.stopPropagation()}
          style={{ padding: "1.5rem", maxWidth: "480px" }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{t("extended.aboutProduct")}</h3>
            <button
              onClick={async () => {
                if (!currentProfile || !artisan) return;
                setProcessing(true);
                const result = await startConversation({
                  customerId: currentProfile.id,
                  artisanId: artisan.id,
                  title: title.trim() || 'General Inquiry',
                });
                setProcessing(false);
                if (result.error) {
                  alert(result.error);
                  return;
                }
                onConversationStarted(result.conversationId!);
                onClose();
              }}
              style={{
                background: 'transparent',
                border: '1px solid var(--outline)',
                padding: '0.4rem 0.8rem',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
              disabled={processing}
            >
              {t("extended.skipJustChat")}
            </button>
          </div>
          <ArtisanProductPicker
            artisan={artisan}
            onOfferConfirmed={handleProductPickerSubmit}
            onBack={() => setStep("title")}
            isProcessing={processing}
          />
        </div>
      </div>
    );
  }

  if (step === "price" && product) {
    return (
      <PriceSetDialog
        product={product}
        onConfirm={handlePriceSubmit}
        onClose={() => setStep("title")}
        isProcessing={processing}
      />
    );
  }

  return null;
}
