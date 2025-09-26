import { EMPTY_STATE_ICON_STYLES, EMPTY_STATE_TITLE_STYLES, EMPTY_STATE_DESCRIPTION_STYLES } from "./CommonStyles";

interface CommonEmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export default function CommonEmptyState({ 
  icon, 
  title, 
  description, 
  action,
  className = ""
}: CommonEmptyStateProps) {
  return (
    <div className={`text-center ${className}`}>
      <div className={EMPTY_STATE_ICON_STYLES}>
        {icon}
      </div>
      <h3 className={EMPTY_STATE_TITLE_STYLES}>{title}</h3>
      <p className={EMPTY_STATE_DESCRIPTION_STYLES}>{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}






