export default function PrimaryButton({
  children,
  onClick,
  variant = "dark",
  fullWidth = false,
  type = "button",
}) {
  const className =
    variant === "light"
      ? "secondary-button"
      : variant === "ghost"
      ? "ghost-button"
      : "primary-button";

  return (
    <button
      type={type}
      onClick={onClick}
      className={className}
      style={{ width: fullWidth ? "100%" : "auto" }}
    >
      {children}
    </button>
  );
}