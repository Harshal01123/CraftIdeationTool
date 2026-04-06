import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import type { Product } from "../../types/chat";
import Spinner from "../Spinner";
import { INDUSTRY_OPTIONS } from "../../constants/industryOptions";
import styles from "./AddProductModal.module.css";
import { useTranslation } from "react-i18next";

type Props = {
  artisanId: string;
  existingProduct?: Product | null;
  onClose: () => void;
  onSaved: () => void;
};

export default function AddProductModal({
  artisanId,
  existingProduct,
  onClose,
  onSaved,
}: Props) {
  const { t } = useTranslation();
  const [name, setName] = useState(existingProduct?.name ?? "");
  const [description, setDescription] = useState(
    existingProduct?.description ?? "",
  );
  const [price, setPrice] = useState(existingProduct?.price?.toString() ?? "");
  const [category, setCategory] = useState(existingProduct?.category ?? "");
  const [weight, setWeight] = useState(existingProduct?.weight ?? "");
  const [dimensions, setDimensions] = useState(
    existingProduct?.dimensions ?? "",
  );

  const [existingImages, setExistingImages] = useState<string[]>(
    existingProduct
      ? ([
          existingProduct.image_url,
          ...(existingProduct.additional_images || []),
        ].filter(Boolean) as string[])
      : [],
  );

  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const combinedPreviews = [...existingImages, ...newPreviews];

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (combinedPreviews.length + files.length > 6) {
      setError("Gathering limit reached: You can upload a maximum of 6 views.");
      e.target.value = "";
      return;
    }

    setNewFiles((prev) => [...prev, ...files]);

    const previews = files.map((f) => URL.createObjectURL(f));
    setNewPreviews((prev) => [...prev, ...previews]);

    e.target.value = "";
    setError("");
  }

  function handleRemoveImage(index: number) {
    if (index < existingImages.length) {
      setExistingImages((prev) => prev.filter((_, i) => i !== index));
    } else {
      const newIdx = index - existingImages.length;
      setNewFiles((prev) => prev.filter((_, i) => i !== newIdx));
      setNewPreviews((prev) => {
        const urlToRevoke = prev[newIdx];
        if (urlToRevoke) URL.revokeObjectURL(urlToRevoke);
        return prev.filter((_, i) => i !== newIdx);
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) return setError("Product name is required.");
    if (!price || isNaN(Number(price)) || Number(price) < 0)
      return setError("Enter a valid price greater than or equal to Rs. 0.");
    if (combinedPreviews.length === 0)
      return setError("Product image is required.");

    setLoading(true);

    let finalUrls: string[] = [...existingImages];

    for (const file of newFiles) {
      const ext = file.name.split(".").pop();
      const filePath = `${artisanId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("products")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        setError(`Failed to upload ${file.name}`);
        setLoading(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("products")
        .getPublicUrl(filePath);
      finalUrls.push(urlData.publicUrl);
    }

    const imageUrl = finalUrls[0] || null;
    const additionalImages = finalUrls.slice(1);

    const productData = {
      name,
      description,
      price: Number(price),
      category,
      weight,
      dimensions,
      image_url: imageUrl,
      additional_images: additionalImages,
    };

    if (existingProduct) {
      const { error: updateError } = await supabase
        .from("products")
        .update(productData)
        .eq("id", existingProduct.id);

      if (updateError) {
        setError("Failed to update product.");
        setLoading(false);
        return;
      }
    } else {
      const { error: insertError } = await supabase.from("products").insert({
        ...productData,
        artisan_id: artisanId,
      });

      if (insertError) {
        setError("Failed to add product.");
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    onSaved();
  }

  return (
    <div className={styles.overlay} onClick={() => !loading && onClose()}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className={styles.closeBtn}
          onClick={onClose}
          disabled={loading}
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        {/* ── Image Section ── */}
        <div className={styles.imageSection}>
          <div className={styles.gradientBg}></div>

          <div className={styles.imageContent}>
            {/* Primary View */}
            <div>
              <p className={styles.sectionLabel}>Primary View</p>
              <div className={styles.mainImageContainer}>
                {combinedPreviews.length > 0 ? (
                  <>
                    <img
                      src={combinedPreviews[0]}
                      alt="Primary"
                      className={styles.mainImage}
                    />
                    <button
                      type="button"
                      className={styles.removeMainBtn}
                      onClick={() => handleRemoveImage(0)}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: "1rem" }}
                      >
                        close
                      </span>
                    </button>
                  </>
                ) : (
                  <>
                    <div className={styles.mainImageAction}>
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: "2.5rem", color: "var(--primary)" }}
                      >
                        photo_camera
                      </span>
                    </div>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className={styles.fileInput}
                      onChange={handleImageChange}
                    />
                  </>
                )}
              </div>

              {combinedPreviews.length === 0 && (
                <div className={styles.uploadTextBtn}>
                  Upload Image
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className={styles.fileInput}
                    onChange={handleImageChange}
                    style={{ top: "auto", height: "30px" }}
                  />
                </div>
              )}
            </div>

            {/* Additional Views */}
            <div>
              <p className={styles.sectionLabel}>Additional Views (Max 5)</p>
              <div className={styles.thumbnailGrid}>
                {combinedPreviews.slice(1).map((src, idx) => (
                  <div key={idx} className={styles.thumbnailSlot}>
                    <img
                      src={src}
                      alt="Thumbnail"
                      className={styles.thumbImage}
                    />
                    <button
                      type="button"
                      className={styles.removeBtn}
                      onClick={() => handleRemoveImage(idx + 1)}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: "0.8rem" }}
                      >
                        close
                      </span>
                    </button>
                  </div>
                ))}

                {combinedPreviews.length < 6 && (
                  <div className={styles.thumbnailSlot}>
                    <span
                      className={`material-symbols-outlined ${styles.thumbIcon}`}
                    >
                      add_a_photo
                    </span>
                    <span className={styles.thumbLabel}>Upload</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className={styles.fileInput}
                      onChange={handleImageChange}
                    />
                  </div>
                )}
                {/* Visual filler slots for the layout */}
                {combinedPreviews.slice(1).length === 0 &&
                  combinedPreviews.length < 6 && (
                    <>
                      <div className={styles.thumbnailSlot}>
                        <span
                          className={`material-symbols-outlined ${styles.thumbIcon}`}
                        >
                          add_a_photo
                        </span>
                        <span className={styles.thumbLabel}>Upload</span>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          className={styles.fileInput}
                          onChange={handleImageChange}
                        />
                      </div>
                      <div className={styles.thumbnailSlot}>
                        <span
                          className={`material-symbols-outlined ${styles.thumbIcon}`}
                        >
                          add_a_photo
                        </span>
                        <span className={styles.thumbLabel}>Upload</span>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          className={styles.fileInput}
                          onChange={handleImageChange}
                        />
                      </div>
                    </>
                  )}
                {combinedPreviews.slice(1).length === 1 && (
                  <div className={styles.thumbnailSlot}>
                    <span
                      className={`material-symbols-outlined ${styles.thumbIcon}`}
                    >
                      add_a_photo
                    </span>
                    <span className={styles.thumbLabel}>Upload</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className={styles.fileInput}
                      onChange={handleImageChange}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Form Section ── */}
        <div className={styles.formSection}>
          <header className={styles.formHeader}>
            <p className={styles.formHindi}>नया उत्पाद</p>
            <h2 className={styles.formTitle}>
              {existingProduct ? t("extended.update") : t("extended.addNewProduct")}
            </h2>
            <p className={styles.formSubtitle}>
              Cataloging the soul of the craft.
            </p>
          </header>

          <form onSubmit={handleSubmit} className={styles.formFields}>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Product Name</label>
              <input
                type="text"
                className={styles.inputElement}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Pashmina Sozni Wrap"
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Craft Type</label>
              <div className={styles.selectWrapper}>
                <select
                  className={styles.selectElement}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="">Select Type</option>
                  {category &&
                    !INDUSTRY_OPTIONS.includes(
                      category as (typeof INDUSTRY_OPTIONS)[number],
                    ) && <option value={category}>{category}</option>}
                  {INDUSTRY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <span
                  className={`material-symbols-outlined ${styles.selectIcon}`}
                >
                  expand_more
                </span>
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Description</label>
              <textarea
                className={styles.textAreaElement}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Narrate the story of this piece..."
                rows={3}
              ></textarea>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Price (INR)</label>
              <div className={styles.priceWrapper}>
                <span className={styles.priceSymbol}>₹</span>
                <input
                  type="number"
                  min="0"
                  className={styles.inputElement}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className={styles.grid2Col}>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Dimensions</label>
                <input
                  type="text"
                  className={styles.inputElement}
                  value={dimensions}
                  onChange={(e) => setDimensions(e.target.value)}
                  placeholder="e.g. 200 x 100 cm"
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Weight</label>
                <input
                  type="text"
                  className={styles.inputElement}
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="e.g. 450g"
                />
              </div>
            </div>

            {error && <p className={styles.errorText}>{error}</p>}

            <div className={styles.submitSection}>
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={loading}
              >
                <span className={styles.submitText}>
                  {loading ? (
                    <>
                      <Spinner size="sm" inline /> Processing...
                    </>
                  ) : existingProduct ? (
                    t("extended.saveChanges")
                  ) : (
                    t("extended.addNewProduct")
                  )}
                </span>
                <div className={styles.submitBtnHover}></div>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
