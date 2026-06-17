import { Image as KonvaImage } from "react-konva";
import { useEffect, useState } from "react";
import useImage from "use-image";
import { useEditorStore } from "../../store/editorStore";
import type { Annotation } from "../../types/annotation";

const BLOCK_SIZE = 10;

/**
 * Pixelates the region of the background covered by the annotation rect.
 * The background is the full screenshot drawn at (0,0) window-size, so the
 * source region is sampled directly at the rect's screen coords.
 */
export default function MosaicShape({ a }: { a: Annotation }) {
  const bg = useEditorStore((s) => s.backgroundImage);
  const [bgImg] = useImage(bg);
  const [mosaicCanvas, setMosaicCanvas] = useState<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!bgImg || !a.rect) return;
    const sx = a.rect.x;
    const sy = a.rect.y;
    const sw = a.rect.width;
    const sh = a.rect.height;

    // Downscale the source region, then upscale with smoothing off = pixelation.
    const smallW = Math.max(1, sw / BLOCK_SIZE);
    const smallH = Math.max(1, sh / BLOCK_SIZE);

    const c = document.createElement("canvas");
    c.width = smallW;
    c.height = smallH;
    const ctx = c.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(bgImg, sx, sy, sw, sh, 0, 0, smallW, smallH);

    const tmp = document.createElement("canvas");
    tmp.width = sw;
    tmp.height = sh;
    const tctx = tmp.getContext("2d")!;
    tctx.imageSmoothingEnabled = false;
    tctx.drawImage(c, 0, 0, smallW, smallH, 0, 0, sw, sh);
    setMosaicCanvas(tmp);
  }, [bgImg, a.rect]);

  if (!a.rect || !mosaicCanvas) return null;
  return <KonvaImage image={mosaicCanvas} x={a.rect.x} y={a.rect.y} listening={false} />;
}
