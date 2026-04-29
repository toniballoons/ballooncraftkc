import React, { useState, useRef } from 'react';
import { uploadFile } from '@/lib/uploadFile';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Upload, X, Image } from 'lucide-react';
import { toast } from 'sonner';

export default function ImageUploadField({ label, value, onChange, aspectRatio = 'aspect-video' }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef();
  const openFilePicker = () => inputRef.current?.click();
  const handlePickerKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openFilePicker();
    }
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await uploadFile(file);
      onChange(file_url);
      toast.success('Image uploaded!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      {label && <Label className="text-sm font-semibold">{label}</Label>}
      {value ? (
        <div className="relative group rounded-xl overflow-hidden border bg-muted">
          <div className={`${aspectRatio} w-full`}>
            <img src={value} alt={label} className="w-full h-full object-cover" />
          </div>
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <label
              className="cursor-pointer bg-white text-black text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
              tabIndex={0}
              onKeyDown={handlePickerKeyDown}
            >
              <Upload className="w-3.5 h-3.5" /> Replace
              <input type="file" accept="image/*" className="sr-only" onChange={handleFile} disabled={uploading} ref={inputRef} />
            </label>
            <Button size="sm" variant="destructive" className="h-8 text-xs" onClick={() => onChange('')}>
              <X className="w-3.5 h-3.5 mr-1" /> Remove
            </Button>
          </div>
          {uploading && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <div className="text-white text-sm font-semibold animate-pulse">Uploading...</div>
            </div>
          )}
        </div>
      ) : (
        <label
          className="cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-8 bg-muted/40 hover:bg-muted/70 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          tabIndex={0}
          onKeyDown={handlePickerKeyDown}
        >
          <Image className="w-8 h-8 text-muted-foreground mb-2" />
          <span className="text-sm font-semibold text-muted-foreground">{uploading ? 'Uploading...' : 'Click to upload image'}</span>
          <span className="text-xs text-muted-foreground mt-1">PNG, JPG, WebP supported</span>
          <input type="file" accept="image/*" className="sr-only" onChange={handleFile} disabled={uploading} ref={inputRef} />
        </label>
      )}
      <Input
        placeholder="Or paste an image URL..."
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        className="text-xs"
      />
    </div>
  );
}
