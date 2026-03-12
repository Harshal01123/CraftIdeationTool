import { useState } from "react";
import { supabase } from "../../lib/supabase";
import type { Product } from "../../types/chat";
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
        <h3 className={styles.title}>
          {existingProduct ? "Edit Product" : "Add New Product"}
        </h3>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.label}>
            Product Name *
            <input
              className={styles.input}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Pottery Vase"
            />
          </label>

          <label className={styles.label}>
            Description
            <textarea
              className={styles.textarea}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your product..."
              rows={3}
            />
          </label>

          <div className={styles.row}>
            <label className={styles.label}>
              Price (₹) *
              <input
                className={styles.input}
                type="number"
                min="1"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 500"
              />
            </label>

            <label className={styles.label}>
              Category
              <input
                className={styles.input}
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Pottery"
              />
            </label>
          </div>

          <label className={styles.label}>
            Product Image {!existingProduct && "*"}
            <div className={styles.imageUploadArea}>
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className={styles.preview}
                />
              ) : (
                <div className={styles.imagePlaceholder}>
                  Click to upload image
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className={styles.fileInput}
              />
            </div>
          </label>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading
                ? "Saving..."
                : existingProduct
                  ? "Save Changes"
                  : "Add Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddProductModal;
