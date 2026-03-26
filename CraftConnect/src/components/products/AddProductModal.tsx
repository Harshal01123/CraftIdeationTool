import { useState } from "react";
import { supabase } from "../../lib/supabase";
import type { Product } from "../../types/chat";
import Spinner from "../Spinner";
import { INDUSTRY_OPTIONS } from "../../constants/industryOptions";
import styles from "./AddProductModal.module.css";

type Props = {
  artisanId: string;
  existingProduct?: Product | null;
  onClose: () => void;
  onSaved: () => void;
};

function AddProductModal({
  artisanId,
  existingProduct,
  onClose,
  onSaved,
}: Props) {
  const [name, setName] = useState(existingProduct?.name ?? "");
  const [description, setDescription] = useState(
    existingProduct?.description ?? "",
  );
  const [price, setPrice] = useState(existingProduct?.price?.toString() ?? "");
  const [category, setCategory] = useState(existingProduct?.category ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    existingProduct?.image_url ?? null,
  );
  const [weight, setWeight] = useState("");
  const [dimensions, setDimensions] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) return setError("Product name is required.");
    if (!price || isNaN(Number(price)) || Number(price) <= 0)
      return setError("Enter a valid price.");
    if (!imageFile && !existingProduct?.image_url)
      return setError("Product image is required.");

    setLoading(true);

    let imageUrl = existingProduct?.image_url ?? null;

    if (imageFile) {
      const ext = imageFile.name.split(".").pop();
      const filePath = `${artisanId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("products")
        .upload(filePath, imageFile, { upsert: true });

      if (uploadError) {
        setError("Image upload failed. Try again.");
        setLoading(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("products")
        .getPublicUrl(filePath);
      imageUrl = urlData.publicUrl;
    }

    if (existingProduct) {
      const { error: updateError } = await supabase
        .from("products")
        .update({
          name,
          description,
          price: Number(price),
          category,
          image_url: imageUrl,
        })
        .eq("id", existingProduct.id);

      if (updateError) {
        setError("Failed to update product.");
        setLoading(false);
        return;
      }
    } else {
      const { error: insertError } = await supabase.from("products").insert({
        artisan_id: artisanId,
        name,
        description,
        price: Number(price),
        category,
        image_url: imageUrl,
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
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <span className={styles.hindiSubtitle}>नया उत्पाद</span>
          <h3 className={styles.title}>
            {existingProduct ? "Edit Product" : "Add New Product"}
          </h3>
          <p className={styles.subtitleText}>Cataloging the soul of the craft.</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          
          {/* Section 1: Artifact Identity */}
          <div className={styles.sectionBlock}>
            <h4 className={styles.sectionHeading}>Artifact Identity</h4>
            <div className={styles.sectionContent}>
              <label className={styles.label}>
                Title
                <input
                  className={styles.input}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Kanjeevaram Silk Saree"
                />
              </label>
              <label className={styles.label}>
                Origin Story
                <textarea
                  className={styles.textarea}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide the historical context and technique used."
                  rows={3}
                />
              </label>
            </div>
          </div>

          {/* Section 2: Pricing & Metrics */}
          <div className={styles.sectionBlock}>
            <h4 className={styles.sectionHeading}>Pricing & Metrics</h4>
            <div className={styles.formRow3}>
              <label className={styles.label}>
                Guild Value (₹)
                <input
                  className={styles.input}
                  type="number"
                  min="1"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                />
              </label>
              <label className={styles.label}>
                Weight (kg)
                <input
                  className={styles.input}
                  type="number"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="0.0"
                />
              </label>
              <label className={styles.label}>
                Dimensions (cm)
                <input
                  className={styles.input}
                  type="text"
                  value={dimensions}
                  onChange={(e) => setDimensions(e.target.value)}
                  placeholder="L x W x H"
                />
              </label>
            </div>
          </div>

          {/* Section 3: Category & Curation */}
          <div className={styles.sectionBlock}>
            <h4 className={styles.sectionHeading}>Category & Curation</h4>
            <div className={styles.formRow2}>
              <label className={styles.label}>
                Craft Category
                <select
                  className={styles.input}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="">Select Category</option>
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
              </label>
            </div>
          </div>

          {/* Images */}
          <div className={styles.sectionBlock}>
            <h4 className={styles.sectionHeading}>Images</h4>
            <p className={styles.helperText} style={{marginBottom: "1rem"}}>Upload at least 3 high-resolution images showing texture and detail.</p>
            <div className={styles.imageUploadArea}>
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className={styles.preview}
                />
              ) : (
                <div className={styles.imagePlaceholder}>
                  <span className="material-symbols-outlined" style={{ fontSize: "2rem", marginBottom: "0.5rem", color: "var(--primary)" }}>add_photo_alternate</span>
                  <span>Click to upload high-quality cover photo</span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className={styles.fileInput}
              />
            </div>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={loading}
            >
              Discard Draft
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner size="sm" inline />
                  Publishing...
                </>
              ) : existingProduct ? (
                "Update Catalog"
              ) : (
                "Publish to Catalog"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddProductModal;
