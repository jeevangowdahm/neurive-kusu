'use client';

import { useState, useCallback } from 'react';
import { CloudUpload, FileText, Image as ImageIcon, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { audioSynth } from '@/lib/audio';

interface UploadDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  files: File[];
  onFileRemoved: (index: number) => void;
}

export function UploadDropzone({ onFilesSelected, files, onFileRemoved }: UploadDropzoneProps) {
  const [dragging, setDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    
    if (e.dataTransfer.files) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      validateAndAddFiles(droppedFiles);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      validateAndAddFiles(selectedFiles);
    }
  };

  const validateAndAddFiles = (fileList: File[]) => {
    audioSynth.playPaperRustle();
    const validFiles = fileList.filter(file => {
      const isValidType = [
        'application/pdf', 
        'image/jpeg', 
        'image/png', 
        'image/tiff', 
        'image/tif'
      ].includes(file.type) || file.name.endsWith('.pdf') || file.name.endsWith('.tiff') || file.name.endsWith('.tif');
      
      const isValidSize = file.size <= 50 * 1024 * 1024; // 50MB
      return isValidType && isValidSize;
    });

    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-upload-input')?.click()}
        className={`border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer select-none relative overflow-hidden group
          ${dragging 
            ? 'border-primary bg-primary/10 shadow-[0_0_20px_rgba(59,130,246,0.3)]' 
            : 'border-white/10 bg-white/5 hover:border-primary/40 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(59,130,246,0.1)]'}`}
      >
        <input 
          id="file-upload-input" 
          type="file" 
          multiple 
          accept=".pdf,.jpg,.jpeg,.png,.tiff,.tif" 
          className="hidden" 
          onChange={handleFileInput} 
        />
        
        {/* Glow effect */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <CloudUpload className="h-12 w-12 text-muted-foreground group-hover:text-primary mx-auto mb-4 animate-pulse transition-colors" />
        <p className="text-sm font-semibold text-foreground mb-1">
          Drag and drop historical scrolls, maps, or records here
        </p>
        <p className="text-xs text-muted-foreground mb-4">
          Supports PDF, JPEG, PNG, TIFF files up to 50MB
        </p>
        
        <div className="flex flex-wrap justify-center gap-2">
          {['Copper Plates', 'Cadastral Maps', 'Royal Decrees', 'Census Records'].map(tag => (
            <Badge 
              key={tag} 
              variant="secondary" 
              className="text-[10px] py-0.5 px-2 bg-white/10 border-white/5 hover:bg-primary/20 hover:text-white transition-colors"
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Queued Scrolls ({files.length})
          </p>
          <div className="grid gap-2">
            {files.map((file, i) => (
              <div 
                key={i} 
                className="flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm text-xs animate-slide-up"
              >
                {file.name.endsWith('.pdf') ? (
                  <FileText className="h-5 w-5 text-rose-400 shrink-0" />
                ) : (
                  <ImageIcon className="h-5 w-5 text-sky-400 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{file.name}</p>
                  <p className="text-[10px] text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    audioSynth.playPaperRustle();
                    onFileRemoved(i);
                  }} 
                  className="p-1 hover:bg-rose-500/20 text-muted-foreground hover:text-rose-400 rounded-md transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
