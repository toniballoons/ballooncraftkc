import React, { useRef, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { uploadFile } from '@/lib/uploadFile';
import { GripVertical, X, Plus } from 'lucide-react';
import { toast } from 'sonner';

/**
 * DraggableGallery — drag-to-reorder gallery with Before/After labels and multi-upload.
 *
 * Props:
 *   images: Array<{ url: string, label: 'before' | 'after' | null }>
 *   onChange: (images) => void
 */
export default function DraggableGallery({ images = [], onChange }) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState([]);
  const uploadInputRef = useRef(null);

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const reordered = Array.from(images);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    onChange(reordered);
  };

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    setUploadProgress(files.map(f => ({ name: f.name, done: false })));

    const newImages = [...images];
    for (let i = 0; i < files.length; i++) {
      try {
        const { file_url } = await uploadFile(files[i]);
        newImages.push({ url: file_url, label: null });
        setUploadProgress(prev => prev.map((p, idx) => idx === i ? { ...p, done: true } : p));
      } catch (err) {
        toast.error(`Failed to upload ${files[i].name}: ${err.message}`);
      }
    }
    onChange(newImages);
    setUploading(false);
    setUploadProgress([]);
    // Reset input
    e.target.value = '';
  };

  const handleRemove = (index) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const handleLabelChange = (index, label) => {
    const updated = images.map((img, i) =>
      i === index ? { ...img, label: img.label === label ? null : label } : img
    );
    onChange(updated);
  };
  const openUploadPicker = () => uploadInputRef.current?.click();

  return (
    <div className="space-y-3">
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="gallery" direction="horizontal">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex flex-wrap gap-3"
            >
              {images.map((img, index) => (
                <Draggable key={img.url + index} draggableId={`img-${index}`} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`relative group rounded-xl overflow-hidden border bg-muted w-28 h-28 flex-shrink-0 ${snapshot.isDragging ? 'shadow-2xl ring-2 ring-primary' : ''}`}
                    >
                      <img src={img.url} alt={`Gallery image ${index + 1} preview`} className="w-full h-full object-cover" />

                      {/* Drag handle */}
                      <div
                        {...provided.dragHandleProps}
                        className="absolute top-1 left-1 bg-black/50 rounded p-0.5 cursor-grab opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity"
                        aria-label={`Reorder gallery image ${index + 1}`}
                      >
                        <GripVertical className="w-3 h-3 text-white" />
                      </div>

                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={() => handleRemove(index)}
                        className="absolute top-1 right-1 bg-black/50 rounded-full p-0.5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity"
                        aria-label={`Remove gallery image ${index + 1}`}
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>

                      {/* Before/After toggle */}
                      <div className="absolute bottom-0 left-0 right-0 flex">
                        <button
                          type="button"
                          onClick={() => handleLabelChange(index, 'before')}
                          aria-pressed={img.label === 'before'}
                          className={`flex-1 text-[9px] font-bold py-0.5 transition-colors ${img.label === 'before' ? 'bg-blue-500 text-white' : 'bg-black/40 text-white/70 hover:bg-blue-400/70'}`}
                        >
                          Before
                        </button>
                        <button
                          type="button"
                          onClick={() => handleLabelChange(index, 'after')}
                          aria-pressed={img.label === 'after'}
                          className={`flex-1 text-[9px] font-bold py-0.5 transition-colors ${img.label === 'after' ? 'bg-green-500 text-white' : 'bg-black/40 text-white/70 hover:bg-green-400/70'}`}
                        >
                          After
                        </button>
                      </div>

                      {/* Label badge */}
                      {img.label && (
                        <div className={`absolute top-1 left-1/2 -translate-x-1/2 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${img.label === 'before' ? 'bg-blue-500' : 'bg-green-500'} text-white`}>
                          {img.label}
                        </div>
                      )}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}

              {/* Upload button */}
              <label
                className={`w-28 h-28 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-muted/70 transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openUploadPicker();
                  }
                }}
              >
                <Plus className="w-5 h-5 text-muted-foreground mb-1" />
                <span className="text-xs text-muted-foreground text-center px-1">
                  {uploading ? 'Uploading…' : 'Add photos'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={handleFiles}
                  disabled={uploading}
                  ref={uploadInputRef}
                />
              </label>
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Upload progress */}
      {uploadProgress.length > 0 && (
        <div className="space-y-1">
          {uploadProgress.map((p, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className={`w-2 h-2 rounded-full ${p.done ? 'bg-green-500' : 'bg-yellow-400 animate-pulse'}`} />
              {p.name} {p.done ? '✓' : 'uploading…'}
            </div>
          ))}
        </div>
      )}

      {images.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Drag thumbnails to reorder. Click Before/After to label transformation photos.
        </p>
      )}
    </div>
  );
}
