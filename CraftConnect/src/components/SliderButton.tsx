import styles from "./SliderButton.module.css";

type SliderButtonProps = {
  direction: "left" | "right";
  children: string;
  onClick?: () => void;
};

function SliderButton({ direction, children, onClick }: SliderButtonProps) {
  return (
    <button
      className={`${styles.sliderBtn} ${styles[direction]}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export default SliderButton;
