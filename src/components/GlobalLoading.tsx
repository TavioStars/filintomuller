import loadingGif from "@/assets/loading-logo.gif";

const GlobalLoading = () => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100]">
      <img 
        src={loadingGif} 
        alt="Carregando..." 
        className="w-28 h-28 drop-shadow-lg"
      />
    </div>
  );
};

export default GlobalLoading;
