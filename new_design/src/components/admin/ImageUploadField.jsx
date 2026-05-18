import React, { useRef, useState } from 'react';
import { Image, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { uploadFile } from '@/lib/uploadFile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ImageUploadField({ label, value, onChange }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const openPicker = () => inputRef.current?.click();

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await uploadFile(file);
      onChange(file_url);
      toast.success(`${label} updated`);
    } catch (error) {
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="rounded-2xl border bg-card p-4 space-y-3">
        <div className="flex items-center gap-4">
          <div className="w-24 h-24 rounded-xl bg-muted overflow-hidden flex items-center justify-center flex-shrink-0">
            {value ? (
              <img src={value} alt={label} className="w-full h-full object-cover" />
            ) : (
              <Image className="w-6 h-6 text-muted-foreground" />
            )}
          </div>
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={openPicker}
              disabled={uploading}
            >
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? 'Uploading...' : 'Upload Image'}
            </Button>
            <p className="text-xs text-muted-foreground">
              Upload a new asset or paste an image URL below.
            </p>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={handleFile}
          disabled={uploading}
        />
        <Input
          value={value || ''}
          onChange={(event) => onChange(event.target.value)}
          placeholder="https://example.com/image.jpg"
        />
      </div>
    </div>
  );
}
