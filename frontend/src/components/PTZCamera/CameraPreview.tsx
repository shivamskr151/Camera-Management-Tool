import React, { useRef, useEffect } from 'react';

interface CameraPreviewProps {
  showGridlines: boolean;
  panTilt: { pan: number; tilt: number };
  zoom: number;
}

const CameraPreview: React.FC<CameraPreviewProps> = ({ 
  showGridlines, 
  panTilt, 
  zoom 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const drawCameraView = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (showGridlines) {
        ctx.strokeStyle = "#333";
        ctx.lineWidth = 1;
        for (let x = 0; x <= canvas.width; x += 30) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
        }
        for (let y = 0; y <= canvas.height; y += 30) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }
      }

      // Draw camera indicator
      ctx.fillStyle = "#4CAF50";
      ctx.beginPath();
      ctx.arc(
        canvas.width / 2 + panTilt.pan * 50,
        canvas.height / 2 + panTilt.tilt * 50,
        10 * zoom,
        0,
        Math.PI * 2
      );
      ctx.fill();
    };

    drawCameraView();
  }, [showGridlines, panTilt, zoom]);

  return (
    <canvas 
      ref={canvasRef}
      className="w-full h-full" 
      width={300}
      height={180}
    />
  );
};

export default CameraPreview; 