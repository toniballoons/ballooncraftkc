import React, { useRef, useState } from 'react';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { Camera, ChevronDown, ChevronUp, GripVertical, ImagePlus, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { uploadFile } from '@/lib/uploadFile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ImageUploadField from '@/components/admin/ImageUploadField';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

function emptyGalleryItem() {
  return {
    url: '',
    title: '',
    description: '',
  };
}

export default function GalleryEditor({ content, setContent }) {
  const update = (key, value) => setContent((prev) => ({ ...prev, [key]: value }));
  const items = Array.isArray(content.items) ? content.items : [];
  const addInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const updateItems = (nextItems) => update('items', nextItems);
  const updateItem = (index, key, value) => {
    const nextItems = items.map((item, itemIndex) => (
      itemIndex === index ? { ...item, [key]: value } : item
    ));
    updateItems(nextItems);
  };

  const addBlankCard = () => {
    updateItems([...items, emptyGalleryItem()]);
  };

  const removeItem = (index) => {
    updateItems(items.filter((_, itemIndex) => itemIndex !== index));
  };

  const moveItem = (index, direction) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= items.length) return;

    const reordered = [...items];
    [reordered[index], reordered[nextIndex]] = [reordered[nextIndex], reordered[index]];
    updateItems(reordered);
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const reordered = [...items];
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    updateItems(reordered);
  };

  const handleAddFiles = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    setUploading(true);
    const nextItems = [...items];

    for (const file of files) {
      try {
        const { file_url } = await uploadFile(file);
        nextItems.push({
          ...emptyGalleryItem(),
          url: file_url,
          title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' '),
        });
      } catch (error) {
        toast.error(error.message || `Failed to upload ${file.name}`);
      }
    }

    updateItems(nextItems);
    setUploading(false);
    event.target.value = '';
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Label>Page Title</Label>
        <Input
          value={content.title || ''}
          onChange={(event) => update('title', event.target.value)}
          placeholder="Balloon Decor Gallery"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Subtitle</Label>
        <Textarea
          value={content.subtitle || ''}
          onChange={(event) => update('subtitle', event.target.value)}
          rows={2}
          placeholder="Showcase your most exciting installs, color stories, and event moments."
        />
      </div>
      <div className="space-y-1.5">
        <Label>Intro Paragraph</Label>
        <Textarea
          value={content.intro || ''}
          onChange={(event) => update('intro', event.target.value)}
          rows={4}
          placeholder="Tell visitors what they are looking at and what kinds of events this gallery represents."
        />
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Gallery images</CardTitle>
          <p className="text-sm text-muted-foreground">
            Upload new images, drag cards to rearrange the order, and give each photo a short title and description for the public gallery page.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => addInputRef.current?.click()} disabled={uploading}>
              <Upload className="w-4 h-4 mr-1" />
              {uploading ? 'Uploading...' : 'Upload gallery photos'}
            </Button>
            <Button type="button" variant="outline" onClick={() => cameraInputRef.current?.click()} disabled={uploading}>
              <Camera className="w-4 h-4 mr-1" />
              Use camera
            </Button>
            <Button type="button" variant="outline" onClick={addBlankCard}>
              <ImagePlus className="w-4 h-4 mr-1" />
              Add empty photo card
            </Button>
          </div>

          <input
            ref={addInputRef}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={handleAddFiles}
            disabled={uploading}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={handleAddFiles}
            disabled={uploading}
          />

          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="gallery-items">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-4">
                  {items.map((item, index) => (
                    <Draggable key={`${item.url || 'gallery-item'}-${index}`} draggableId={`gallery-item-${index}`} index={index}>
                      {(dragProvided, snapshot) => (
                        <Card
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          className={snapshot.isDragging ? 'ring-2 ring-primary shadow-xl' : ''}
                        >
                          <CardContent className="p-4">
                            <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
                              <div className="space-y-3">
                                <ImageUploadField
                                  label={`Gallery image ${index + 1}`}
                                  value={item.url || ''}
                                  onChange={(url) => updateItem(index, 'url', url)}
                                  compact
                                  allowUrlInput
                                  buttonLabel="Choose photo"
                                  cameraFacing="environment"
                                  editorPreset="landscape"
                                  helperText="Replace this gallery photo from a phone or desktop, use the camera, crop it, or paste a direct image URL."
                                />
                                <div className="flex items-center gap-2">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => moveItem(index, -1)}
                                    disabled={index === 0}
                                    aria-label={`Move gallery item ${index + 1} up`}
                                  >
                                    <ChevronUp className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => moveItem(index, 1)}
                                    disabled={index === items.length - 1}
                                    aria-label={`Move gallery item ${index + 1} down`}
                                  >
                                    <ChevronDown className="w-4 h-4" />
                                  </Button>
                                  <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)} aria-label={`Remove gallery item ${index + 1}`}>
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                  </Button>
                                  <div
                                    {...dragProvided.dragHandleProps}
                                    className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-background text-muted-foreground cursor-grab"
                                    aria-label={`Reorder gallery item ${index + 1}`}
                                  >
                                    <GripVertical className="w-4 h-4" />
                                  </div>
                                </div>
                              </div>
                              <div className="space-y-3">
                                <div className="space-y-1.5">
                                  <Label>Short title</Label>
                                  <Input
                                    value={item.title || ''}
                                    onChange={(event) => updateItem(index, 'title', event.target.value)}
                                    placeholder="Grand opening storefront install"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label>Short description</Label>
                                  <Textarea
                                    value={item.description || ''}
                                    onChange={(event) => updateItem(index, 'description', event.target.value)}
                                    rows={3}
                                    placeholder="A quick caption visitors will see under this gallery image."
                                  />
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          <p className="text-xs text-muted-foreground">
            Tip: keep captions short, descriptive, and event-focused so the page feels polished and SEO-friendly.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
