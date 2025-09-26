import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { COMMON_CARD_STYLES, COMMON_CARD_HEADER_STYLES, COMMON_CARD_TITLE_STYLES } from "./CommonStyles";

interface CommonCardProps {
  children: React.ReactNode;
  className?: string;
  header?: {
    title: string;
    icon?: React.ReactNode;
  };
}

export default function CommonCard({ children, className = "", header }: CommonCardProps) {
  return (
    <Card className={`${COMMON_CARD_STYLES} ${className}`}>
      {header && (
        <CardHeader className={COMMON_CARD_HEADER_STYLES}>
          <CardTitle className={COMMON_CARD_TITLE_STYLES}>
            {header.icon && <span className="mr-2">{header.icon}</span>}
            {header.title}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}






