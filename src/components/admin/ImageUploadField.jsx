import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, Image as ImageIcon, RotateCw, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { uploadFile } from '@/lib/uploadFile';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const ASPECT_OPTIONS = {
  original: { label: 'Original', ratio: null },
  square: { label: 'Square', ratio: 1 },
  portrait: { label: 'Portrait', ratio: 4 / 5 },
  landscape: { label: 'Landscape', ratio: 16 / 9 },
  banner: { label: 'Banner', ratio: 3 / 1 },
};

const PRESET_GROUPS = {
  avatar: ['square', 'portrait', 'original'],
  banner: ['banner', 'landscape', 'square', 'original'],
  portrait: ['portrait', 'square', 'landscape', 'original'],
  landscape: ['landscape', 'square', 'portrait', 'original'],
};

function getPresetKeys(editorPreset) {
  return PRESET_GROUPS[editorPreset] || PRESET_GROUPS.landscape;
}

function normalizeRotation(rotation) {
  return ((rotation % 360) + 360) % 360;
}

function buildFileName(file, extension) {
  const original = String(file?.name || 'image-upload').replace(/\.[^.]+$/, '');
  const safeBase = original
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'image-upload';

  return `${safeBase}.${extension}`;
}

function blobToFile(blob, fileName) {
  return new File([blob], fileName, {
    type: blob.type || 'image/jpeg',
    lastModified: Date.now(),
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Unable to read that image.'));
    image.src = src;
  });
}

function canvasToBlob(canvas, mimeType, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Unable to prepare that image for upload.'));
      }
    }, mimeType, quality);
  });
}

function resolveAspectRatio(aspectKey, sourceWidth, sourceHeight) {
  const preset = ASPECT_OPTIONS[aspectKey];
  if (!preset || !preset.ratio) {
    return sourceWidth && sourceHeight ? sourceWidth / sourceHeight : 1;
  }
  return preset.ratio;
}

function getOutputDimensions(aspectRatio, maxEdge) {
  if (aspectRatio >= 1) {
    return {
      width: maxEdge,
      height: Math.max(1, Math.round(maxEdge / aspectRatio)),
    };
  }

  return {
    width: Math.max(1, Math.round(maxEdge * aspectRatio)),
    height: maxEdge,
  };
}

async function createEditedUploadFile({
  file,
  previewUrl,
  aspectKey,
  zoom,
  offsetX,
  offsetY,
  rotation,
  outputMaxEdge,
}) {
  const image = await loadImage(previewUrl);
  const safeRotation = normalizeRotation(rotation);
  const targetAspectRatio = resolveAspectRatio(aspectKey, image.width, image.height);
  const { width: outputWidth, height: outputHeight } = getOutputDimensions(targetAspectRatio, outputMaxEdge);

  const logicalImageWidth = safeRotation % 180 === 0 ? image.width : image.height;
  const logicalImageHeight = safeRotation % 180 === 0 ? image.height : image.width;

  const coverScale = Math.max(outputWidth / logicalImageWidth, outputHeight / logicalImageHeight) * zoom;
  const renderedWidth = logicalImageWidth * coverScale;
  const renderedHeight = logicalImageHeight * coverScale;
  const maxOffsetX = Math.max(0, (renderedWidth - outputWidth) / 2);
  const maxOffsetY = Math.max(0, (renderedHeight - outputHeight) / 2);
  const appliedOffsetX = (offsetX / 100) * maxOffsetX;
  const appliedOffsetY = (offsetY / 100) * maxOffsetY;

  const canvas = window.document.createElement('canvas');
  canvas.width = outputWidth;
  canvas.height = outputHeight;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Unable to edit that image right now.');
  }

  context.clearRect(0, 0, outputWidth, outputHeight);
  context.save();
  context.translate((outputWidth / 2) + appliedOffsetX, (outputHeight / 2) + appliedOffsetY);
  context.rotate((safeRotation * Math.PI) / 180);
  context.scale(coverScale, coverScale);
  context.drawImage(image, -image.width / 2, -image.height / 2);
  context.restore();

  const outputMimeType = file.type === 'image/png'
    ? 'image/png'
    : file.type === 'image/webp'
      ? 'image/webp'
      : 'image/jpeg';

  const extension = outputMimeType === 'image/png'
    ? 'png'
    : outputMimeType === 'image/webp'
      ? 'webp'
      : 'jpg';

  const blob = await canvasToBlob(canvas, outputMimeType, outputMimeType === 'image/jpeg' ? 0.92 : undefined);
  return blobToFile(blob, buildFileName(file, extension));
}

export default function ImageUploadField({
  label,
  value,
  onChange,
  aspectRatio = 'aspect-video',
  editorPreset = 'landscape',
  shape = 'rect',
  helperText = 'Upload a new photo, use your camera, or paste an image URL.',
  buttonLabel = 'Upload image',
  allowUrlInput = true,
  allowRemove = true,
  cameraFacing = 'environment',
  compact = false,
  disabled = false,
  outputMaxEdge,
}) {
  const libraryInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const activeObjectUrlRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [imageMeta, setImageMeta] = useState({ width: 0, height: 0 });
  const [aspectKey, setAspectKey] = useState(getPresetKeys(editorPreset)[0] || 'landscape');
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [rotation, setRotation] = useState(0);

  const previewShapeClass = shape === 'avatar' ? 'rounded-full' : 'rounded-2xl';
  const previewFrameClass = shape === 'avatar'
    ? 'w-24 h-24'
    : compact
      ? cn('w-full max-w-[12rem]', aspectRatio)
      : cn('w-full max-w-xs', aspectRatio);
  const resolvedOutputMaxEdge = outputMaxEdge || (shape === 'avatar' ? 1400 : 2000);
  const presetKeys = useMemo(() => getPresetKeys(editorPreset), [editorPreset]);
  const editorAspectRatio = resolveAspectRatio(aspectKey, imageMeta.width, imageMeta.height) || 1;
  const objectPositionX = `${50 + (offsetX * 0.35)}%`;
  const objectPositionY = `${50 + (offsetY * 0.35)}%`;

  useEffect(() => () => {
    if (activeObjectUrlRef.current) {
      URL.revokeObjectURL(activeObjectUrlRef.current);
    }
  }, []);

  useEffect(() => {
    if (!editorOpen && activeObjectUrlRef.current) {
      URL.revokeObjectURL(activeObjectUrlRef.current);
      activeObjectUrlRef.current = null;
    }
  }, [editorOpen]);

  const resetEditor = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setImageMeta({ width: 0, height: 0 });
    setZoom(1);
    setOffsetX(0);
    setOffsetY(0);
    setRotation(0);
    setAspectKey(getPresetKeys(editorPreset)[0] || 'landscape');
  };

  const closeEditor = () => {
    setEditorOpen(false);
    resetEditor();
  };

  const openFileSelector = (target) => {
    if (disabled || uploading) return;
    if (target === 'camera') {
      cameraInputRef.current?.click();
      return;
    }
    libraryInputRef.current?.click();
  };

  const prepareFileForEditing = async (file) => {
    if (!file) return;

    if (activeObjectUrlRef.current) {
      URL.revokeObjectURL(activeObjectUrlRef.current);
      activeObjectUrlRef.current = null;
    }

    const objectUrl = URL.createObjectURL(file);
    activeObjectUrlRef.current = objectUrl;

    try {
      const image = await loadImage(objectUrl);
      setSelectedFile(file);
      setPreviewUrl(objectUrl);
      setImageMeta({ width: image.width, height: image.height });
      setAspectKey(getPresetKeys(editorPreset)[0] || 'landscape');
      setZoom(1);
      setOffsetX(0);
      setOffsetY(0);
      setRotation(0);
      setEditorOpen(true);
    } catch (error) {
      toast.error(error.message || 'That image could not be opened.');
      URL.revokeObjectURL(objectUrl);
      activeObjectUrlRef.current = null;
    }
  };

  const handleFileSelection = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    await prepareFileForEditing(file);
  };

  const handleSaveEditedImage = async () => {
    if (!selectedFile || !previewUrl) return;

    setUploading(true);
    try {
      const editedFile = await createEditedUploadFile({
        file: selectedFile,
        previewUrl,
        aspectKey,
        zoom,
        offsetX,
        offsetY,
        rotation,
        outputMaxEdge: resolvedOutputMaxEdge,
      });
      const { file_url } = await uploadFile(editedFile);
      onChange(file_url);
      toast.success(`${label} updated`);
      closeEditor();
    } catch (error) {
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className={cn('rounded-2xl border bg-card p-4 space-y-4', compact && 'p-3')}>
        <div className={cn('flex gap-4', compact ? 'flex-col' : 'flex-col sm:flex-row sm:items-center')}>
          <div className={cn('overflow-hidden bg-muted flex items-center justify-center flex-shrink-0', previewShapeClass, previewFrameClass)}>
            {value ? (
              <img src={value} alt={label} className={cn('w-full h-full object-cover', previewShapeClass)} />
            ) : (
              <ImageIcon className="w-6 h-6 text-muted-foreground" />
            )}
          </div>
          <div className="space-y-3 flex-1">
            <p className="text-xs text-muted-foreground leading-5">{helperText}</p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => openFileSelector('library')} disabled={disabled || uploading}>
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? 'Uploading...' : buttonLabel}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => openFileSelector('camera')} disabled={disabled || uploading}>
                <Camera className="w-4 h-4 mr-2" />
                Use camera
              </Button>
              {allowRemove && value ? (
                <Button type="button" variant="ghost" size="sm" onClick={() => onChange('')} disabled={disabled || uploading}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        <input
          ref={libraryInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={handleFileSelection}
          disabled={disabled || uploading}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture={cameraFacing}
          className="sr-only"
          onChange={handleFileSelection}
          disabled={disabled || uploading}
        />

        {allowUrlInput ? (
          <Input
            value={value || ''}
            onChange={(event) => onChange(event.target.value)}
            placeholder="https://example.com/image.jpg"
            disabled={disabled || uploading}
          />
        ) : null}
      </div>

      <Dialog open={editorOpen} onOpenChange={(open) => { if (!open && !uploading) closeEditor(); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{label} editor</DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <div className="rounded-2xl border bg-muted/20 p-4">
              <div
                className={cn(
                  'relative mx-auto overflow-hidden bg-black/5 border',
                  previewShapeClass,
                  shape === 'avatar' ? 'max-w-[18rem]' : 'w-full',
                )}
                style={{ aspectRatio: `${editorAspectRatio}` }}
              >
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt={`Editing ${label}`}
                    className={cn('absolute inset-0 h-full w-full object-cover', previewShapeClass)}
                    style={{
                      objectPosition: `${objectPositionX} ${objectPositionY}`,
                      transform: `scale(${zoom}) rotate(${rotation}deg)`,
                      transformOrigin: 'center center',
                    }}
                  />
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <Label>Crop shape</Label>
                <div className="flex flex-wrap gap-2">
                  {presetKeys.map((key) => (
                    <Button
                      key={key}
                      type="button"
                      size="sm"
                      variant={aspectKey === key ? 'default' : 'outline'}
                      onClick={() => setAspectKey(key)}
                    >
                      {ASPECT_OPTIONS[key].label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Rotate</Label>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => setRotation((current) => current - 90)}>
                    <RotateCw className="w-4 h-4 mr-2 -scale-x-100" />
                    Rotate left
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => setRotation((current) => current + 90)}>
                    <RotateCw className="w-4 h-4 mr-2" />
                    Rotate right
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor={`${label}-zoom`}>Zoom</Label>
                  <span className="text-xs text-muted-foreground">{zoom.toFixed(2)}x</span>
                </div>
                <input
                  id={`${label}-zoom`}
                  type="range"
                  min="1"
                  max="2.5"
                  step="0.01"
                  value={zoom}
                  onChange={(event) => setZoom(Number(event.target.value))}
                  className="w-full accent-primary"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor={`${label}-horizontal`}>Horizontal position</Label>
                  <span className="text-xs text-muted-foreground">{offsetX}</span>
                </div>
                <input
                  id={`${label}-horizontal`}
                  type="range"
                  min="-100"
                  max="100"
                  step="1"
                  value={offsetX}
                  onChange={(event) => setOffsetX(Number(event.target.value))}
                  className="w-full accent-primary"
                />
              </div>

              <div className="space-y-2 lg:col-span-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor={`${label}-vertical`}>Vertical position</Label>
                  <span className="text-xs text-muted-foreground">{offsetY}</span>
                </div>
                <input
                  id={`${label}-vertical`}
                  type="range"
                  min="-100"
                  max="100"
                  step="1"
                  value={offsetY}
                  onChange={(event) => setOffsetY(Number(event.target.value))}
                  className="w-full accent-primary"
                />
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-3">
              <Button type="button" variant="outline" onClick={closeEditor} disabled={uploading}>
                Cancel
              </Button>
              <Button type="button" onClick={handleSaveEditedImage} disabled={uploading}>
                {uploading ? 'Saving image...' : 'Save image'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
