import type { OfferPayload } from "../../types/chat";
import styles from "./OfferCard.module.css";

interface Props {
  payload: OfferPayload;
  isMine: boolean;
  isLatestPendingOffer: boolean;
  isArtisan: boolean;
  onAccept?: () => void;
  onReject?: () => void;
  onBargain?: () => void;
  disabled?: boolean;
}

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  pending:   { label: "Awaiting Response", cls: "pending" },
  accepted:  { label: "Accepted",           cls: "accepted" },
  rejected:  { label: "Rejected",           cls: "rejected" },
  countered: { label: "Countered",           cls: "countered" },
};

export default function OfferCard({
  payload,
  isMine,
  isLatestPendingOffer,
  isArtisan,
  onAccept,
  onReject,
  onBargain,
  disabled,
}: Props) {
  const { productName, imageUrl, listedPrice, offeredPrice, status } = payload;
  const statusInfo = STATUS_LABELS[status] ?? STATUS_LABELS.pending;

  const showArtisanActions = isArtisan && !isMine && isLatestPendingOffer && status === "pending";
  const showCounterActions = !isArtisan && !isMine && isLatestPendingOffer && status === "pending";

  return (
    <div className={`${styles.card} ${isMine ? styles.mine : styles.theirs}`}>
      <div className={styles.inner}>
        {/* Product Image */}
        <div className={styles.thumb}>
          {imageUrl ? (
            <img src={imageUrl} alt={productName} className={styles.thumbImg} />
          ) : (
            <div className={styles.thumbPlaceholder}>
              <span className="material-symbols-outlined">image</span>
            </div>
          )}
        </div>

        {/* Details */}
        <div className={styles.body}>
          <p className={styles.productName}>{productName}</p>
          <p className={styles.listed}>Listed at ₹{listedPrice.toLocaleString()}</p>
          <p className={styles.offered}>
            {isMine ? "Your offer:" : "Offer:"}{" "}
            <strong>₹{offeredPrice.toLocaleString()}</strong>
          </p>
          <span className={`${styles.badge} ${styles[statusInfo.cls]}`}>
            {statusInfo.label}
          </span>
        </div>
      </div>

      {/* Action buttons — artisan side (received offer) */}
      {showArtisanActions && (
        <div className={styles.actions}>
          <button className={styles.btnAccept} onClick={onAccept} disabled={disabled}>
            <span className="material-symbols-outlined">check_circle</span> Accept
          </button>
          <button className={styles.btnBargain} onClick={onBargain} disabled={disabled}>
            <span className="material-symbols-outlined">sync_alt</span> Bargain
          </button>
          <button className={styles.btnReject} onClick={onReject} disabled={disabled}>
            <span className="material-symbols-outlined">cancel</span> Reject
          </button>
        </div>
      )}

      {/* Action buttons — customer who sent the offer, and received a counter */}
      {showCounterActions && (
        <div className={styles.actions}>
          <button className={styles.btnAccept} onClick={onAccept} disabled={disabled}>
            <span className="material-symbols-outlined">check_circle</span> Accept Counter
          </button>
          <button className={styles.btnBargain} onClick={onBargain} disabled={disabled}>
            <span className="material-symbols-outlined">sync_alt</span> Counter Again
          </button>
          <button className={styles.btnReject} onClick={onReject} disabled={disabled}>
            <span className="material-symbols-outlined">cancel</span> Reject
          </button>
        </div>
      )}
    </div>
  );
}
