import loadingLogo from "@/assets/loading-logo.png";

const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 bg-gradient-subtle flex items-center justify-center z-50">
      <img 
        src={loadingLogo} 
        alt="Carregando..." 
        className="w-32 h-32 animate-pulse glow-gradient rounded-full"
      />
    </div>
  );
};

export default LoadingScreen;
