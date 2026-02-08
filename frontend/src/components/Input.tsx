import styles from "./Input.module.css";

interface InputProps {
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function Input({
  type = "text",
  placeholder,
  value,
  onChange,
}: InputProps) {
  return (
    <input
      className={styles.input}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
    />
  );
}

export default Input;
