import { LOADING_SPINNER_STYLES, LOADING_TEXT_STYLES, LOADING_DESCRIPTION_STYLES } from "./CommonStyles";

interface CommonLoadingProps {
  title?: string;
  description?: string;
  className?: string;
}

export default function CommonLoading({ 
  title = "로딩 중...", 
  description = "잠시만 기다려주세요.",
  className = ""
}: CommonLoadingProps) {
  return (
    <div className={`text-center ${className}`}>
      <div className={LOADING_SPINNER_STYLES}></div>
      <h3 className={LOADING_TEXT_STYLES}>{title}</h3>
      <p className={LOADING_DESCRIPTION_STYLES}>{description}</p>
    </div>
  );
}






