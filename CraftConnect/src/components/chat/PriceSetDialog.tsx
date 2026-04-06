import { useState } from "react";
import type { Product } from "../../types/chat";
import styles from "./PriceSetDialog.module.css";
import { useTranslation } from "react-i18next";

interface Props {
  product: Product;
  initialPrice?: number;
  onConfirm: (price: number) => void;
  onClose: () => void;
  isProcessing?: boolean;
  title?: string;
}

export default function PriceSetDialog({
  product,
  initialPrice,
  onConfirm,
  onClose,
  isProcessing,
  title,
}: Props) {
  const { t } = useTranslation();
  const displayTitle = title || t("extended.makeOffer");
  const [price, setPrice] = useState<string>(
    initialPrice !== undefined ? String(initialPrice) : String(product.price)
  );

  const numeric = parseFloat(price);
  const isValid = !isNaN(numeric) && numeric > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    onConfirm(numeric);
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>{displayTitle}</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Product Preview */}
        <div className={styles.productRow}>
          <div className={styles.productThumb}>
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className={styles.productImg} />
            ) : (
              <div className={styles.productThumbEmpty}>
                <span className="material-symbols-outlined">image</span>
              </div>
            )}
          </div>
          <div className={styles.productInfo}>
            <p className={styles.productName}>{product.name}</p>
            <p className={styles.productCategory}>{product.category}</p>
            <p className={styles.productListed}>{t("extended.listedAt")} ₹{product.price.toLocaleString()}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.label}>{t("extended.yourOfferPrice")}</label>
          <div className={styles.inputRow}>
            <span className={styles.rupee}>₹</span>
            <input
              className={styles.input}
              type="number"
              min="1"
              step="1"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              autoFocus
              placeholder={t("extended.enterPrice")}
            />
          </div>
          {numeric > product.price && (
            <p className={styles.hint}>{t("extended.offerAboveListed")}</p>
          )}
          {numeric < product.price * 0.5 && isValid && (
            <p className={styles.warn}>{t("extended.offerBelow50")}</p>
          )}
          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={isProcessing}>
              {t("extended.cancel")}
            </button>
            <button type="submit" className={styles.sendBtn} disabled={!isValid || isProcessing}>
              {isProcessing ? t("extended.sending") : t("extended.sendOffer")}
              <span className="material-symbols-outlined">send</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
