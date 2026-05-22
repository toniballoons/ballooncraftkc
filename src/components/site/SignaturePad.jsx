import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

function getPoint(event, canvas) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

export default function SignaturePad({ value, onChange }) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const [hasSignature, setHasSignature] = useState(Boolean(value));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ratio = window.devicePixelRatio || 1;
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    canvas.width = width * ratio;
    canvas.height = height * ratio;

    const context = canvas.getContext('2d');
    context.scale(ratio, ratio);
    context.fillStyle = '#fff';
    context.fillRect(0, 0, width, height);
    context.lineWidth = 2.4;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = '#111827';

    if (value) {
      const image = new Image();
      image.onload = () => {
        context.drawImage(image, 0, 0, width, height);
      };
      image.src = value;
    }
  }, [value]);

  const endStroke = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawingRef.current = false;
    const nextValue = canvas.toDataURL('image/png');
    setHasSignature(true);
    onChange(nextValue);
  };

  const beginStroke = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawingRef.current = true;
    const context = canvas.getContext('2d');
    const point = getPoint(event, canvas);
    context.beginPath();
    context.moveTo(point.x, point.y);
  };

  const moveStroke = (event) => {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    const point = getPoint(event, canvas);
    context.lineTo(point.x, point.y);
    context.stroke();
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
    setHasSignature(false);
    onChange('');
  };

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-border bg-white p-3">
        <canvas
          ref={canvasRef}
          className="h-40 w-full cursor-crosshair rounded-xl bg-white"
          onPointerDown={beginStroke}
          onPointerMove={moveStroke}
          onPointerUp={endStroke}
          onPointerLeave={() => drawingRef.current && endStroke()}
        />
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Sign with your finger, mouse, or stylus directly in the box.
        </p>
        <Button type="button" variant="outline" size="sm" onClick={clearSignature}>
          {hasSignature ? 'Clear Signature' : 'Reset'}
        </Button>
      </div>
    </div>
  );
}
