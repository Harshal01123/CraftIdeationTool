import { useState, useEffect } from "react";
import type { Profile, Product } from "../../types/chat";
import ArtisanProductPicker from "./ArtisanProductPicker";
import PriceSetDialog from "./PriceSetDialog";
import { startProductConversation } from "../../lib/chatUtils";
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
  const { profile: currentProfile } = useAuth();
  const [step, setStep] = useState<Step>("title");
  const [title, setTitle] = useState("");
  const [processing, setProcessing] = useState(false);

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
          <h3 className={styles.dialogTitle}>Start an Offer</h3>
          <p className={styles.dialogSubtitle}>
            What is this {product ? "offer" : "conversation"} regarding?
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
              Cancel
            </button>
            <button
              className={styles.confirmBtn}
              onClick={() => setStep(product ? "price" : "product")}
              disabled={!title.trim() || processing}
            >
              Continue
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
