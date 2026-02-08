import styles from "./Button.module.css";

interface ButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  active?: boolean;
  onClick?: () => void;
}

function Button({
  children,
  variant = "primary",
  active = false,
  onClick,
}: ButtonProps) {
  return (
    <button
      className={`
        ${styles.button}
        ${styles[variant]}
        ${active ? styles.active : ""}
      `}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export default Button;
