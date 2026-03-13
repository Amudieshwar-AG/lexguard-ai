import logoImage from "../../Tech-Savvy Shield Logo Design.png";

export default function TechShieldLogo({ className = "w-32 h-32" }: { className?: string }) {
  return (
    <img 
      src={logoImage} 
      alt="LexGuard AI Shield Logo" 
      className={className}
    />
  );
}
