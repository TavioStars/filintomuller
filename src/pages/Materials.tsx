import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen } from "lucide-react";

const Materials = () => {
  const navigate = useNavigate();

  const videos = [
    {
      id: "0QoqAjdfsPM",
      title: "Vídeo 1",
    },
    {
      id: "vBhhE-Y6YYs",
      title: "Vídeo 2",
    },
    {
      id: "dEVXre6ZhTo",
      title: "Vídeo 3",
    },
    {
      id: "b7qqC1nv9n4",
      title: "Vídeo 4",
    },
    {
      id: "x1tx_KZZW1M",
      title: "Vídeo 5",
    },
    {
      id: "_EmywnyCOM0",
      title: "Vídeo 6",
    },
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 pb-24 md:pb-8">
      <div className="max-w-6xl mx-auto">
        <Button
          onClick={() => navigate("/menu")}
          variant="ghost"
          className="mb-4 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>

        <div className="flex items-center gap-3 mb-8">
          <BookOpen className="h-8 w-8 text-purple-500" />
          <h1 className="text-3xl font-bold text-foreground">Materiais Didáticos</h1>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {videos.map((video) => (
            <Card
              key={video.id}
              className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => window.open(`https://youtu.be/${video.id}`, '_blank')}
            >
              <img
                src={`https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`}
                alt={video.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="text-lg font-semibold">{video.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Clique para assistir no YouTube
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Materials;
