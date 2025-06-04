'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  ImageIcon,
  Maximize,
  Pause,
  Play,
  Presentation,
  Video,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useState } from 'react';

interface Material {
  type: 'pdf' | 'video' | 'ppt' | 'image';
  name: string;
  url: string;
}

interface MaterialViewerProps {
  materials: Material[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MaterialViewer({ materials, open, onOpenChange }: MaterialViewerProps) {
  const [currentMaterial, setCurrentMaterial] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const material = materials[currentMaterial];

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="h-4 w-4 text-red-600" />;
      case 'video':
        return <Video className="h-4 w-4 text-blue-600" />;
      case 'ppt':
        return <Presentation className="h-4 w-4 text-orange-600" />;
      case 'image':
        return <ImageIcon className="h-4 w-4 text-green-600" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const renderMaterial = () => {
    if (!material) return null;

    switch (material.type) {
      case 'pdf':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm">
                  Página {currentPage} de {totalPages}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <iframe
              src={`${material.url}#page=${currentPage}`}
              className="w-full h-[600px] border rounded"
              title={material.name}
            />
          </div>
        );

      case 'video':
        return (
          <div className="space-y-4">
            <div className="relative">
              <video
                className="w-full h-auto max-h-[600px] rounded"
                controls
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onVolumeChange={(e) => setIsMuted((e.target as HTMLVideoElement).muted)}
              >
                <source src={material.url} type="video/mp4" />
                Tu navegador no soporta el elemento de video.
              </video>
            </div>
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const video = document.querySelector('video');
                  if (video) {
                    if (isPlaying) {
                      video.pause();
                    } else {
                      video.play();
                    }
                  }
                }}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const video = document.querySelector('video');
                  if (video) {
                    video.muted = !video.muted;
                  }
                }}
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const video = document.querySelector('video');
                  if (video) {
                    video.requestFullscreen();
                  }
                }}
              >
                <Maximize className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 'ppt':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm">
                  Diapositiva {currentPage} de {totalPages}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {/* Para PowerPoint, podrías usar Office Online o convertir a imágenes */}
            <div className="w-full h-[600px] border rounded bg-gray-100 flex items-center justify-center">
              <div className="text-center space-y-4">
                <Presentation className="h-16 w-16 text-orange-600 mx-auto" />
                <div>
                  <p className="font-medium">Presentación PowerPoint</p>
                  <p className="text-sm text-muted-foreground">Diapositiva {currentPage}</p>
                </div>
                <Button variant="outline" onClick={() => window.open(material.url, '_blank')}>
                  <Download className="h-4 w-4 mr-2" />
                  Descargar para ver
                </Button>
              </div>
            </div>
          </div>
        );

      case 'image':
        return (
          <div className="space-y-4">
            <img
              src={material.url || '/placeholder.svg'}
              alt={material.name}
              className="w-full h-auto max-h-[600px] object-contain rounded"
            />
          </div>
        );

      default:
        return (
          <div className="w-full h-[600px] border rounded bg-gray-100 flex items-center justify-center">
            <div className="text-center">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p>Tipo de archivo no soportado para vista previa</p>
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getMaterialIcon(material?.type || 'pdf')}
            {material?.name || 'Material de Capacitación'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Material Navigation */}
          {materials.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {materials.map((mat, index) => (
                <Button
                  key={index}
                  variant={currentMaterial === index ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setCurrentMaterial(index);
                    setCurrentPage(1);
                  }}
                  className="flex items-center gap-2"
                >
                  {getMaterialIcon(mat.type)}
                  <span className="hidden sm:inline">{mat.name}</span>
                  <span className="sm:hidden">{index + 1}</span>
                </Button>
              ))}
            </div>
          )}

          {/* Material Content */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Badge variant="outline" className="flex items-center gap-1">
                {getMaterialIcon(material?.type || 'pdf')}
                {material?.type?.toUpperCase()}
              </Badge>
              <Button variant="outline" size="sm" onClick={() => window.open(material?.url, '_blank')}>
                <Download className="h-4 w-4 mr-2" />
                Descargar
              </Button>
            </div>

            {renderMaterial()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
