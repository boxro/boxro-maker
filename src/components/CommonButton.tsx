import { Button } from "@/components/ui/button";
import { PRIMARY_BUTTON_STYLES, SECONDARY_BUTTON_STYLES, OUTLINE_BUTTON_STYLES } from "./CommonStyles";

interface CommonButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline";
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

export default function CommonButton({ 
  children, 
  variant = "primary", 
  className = "", 
  onClick,
  disabled = false,
  type = "button"
}: CommonButtonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "primary":
        return PRIMARY_BUTTON_STYLES;
      case "secondary":
        return SECONDARY_BUTTON_STYLES;
      case "outline":
        return OUTLINE_BUTTON_STYLES;
      default:
        return PRIMARY_BUTTON_STYLES;
    }
  };

  return (
    <Button 
      className={`${getVariantStyles()} ${className}`}
      onClick={onClick}
      disabled={disabled}
      type={type}
    >
      {children}
    </Button>
  );
}






