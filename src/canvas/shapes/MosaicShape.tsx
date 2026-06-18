import { Image as KonvaImage, Rect } from "react-konva";
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
interface Props {
  a: Annotation;
  selectable?: boolean;
}

export default function MosaicShape({ a, selectable = false }: Props) {
  const bg = useEditorStore((s) => s.backgroundImage);
  const selectedId = useEditorStore((s) => s.selectedId);
  const select = useEditorStore((s) => s.selectAnnotation);
  const update = useEditorStore((s) => s.updateAnnotation);
  const [bgImg] = useImage(bg);
  const [mosaicCanvas, setMosaicCanvas] = useState<HTMLCanvasElement | null>(null);
  const isSelected = selectable && selectedId === a.id;

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
  return (
    <>
      <KonvaImage
        image={mosaicCanvas}
        x={a.rect.x}
        y={a.rect.y}
        listening={selectable}
        draggable={isSelected}
        onClick={(e) => {
          if (!selectable) return;
          e.cancelBubble = true;
          select(a.id);
        }}
        onTap={(e) => {
          if (!selectable) return;
          e.cancelBubble = true;
          select(a.id);
        }}
        onDragEnd={(e) => {
          const node = e.target;
          update(a.id, { rect: { ...a.rect!, x: node.x(), y: node.y() } });
        }}
      />
      {isSelected && (
        <Rect
          x={a.rect.x - 4}
          y={a.rect.y - 4}
          width={a.rect.width + 8}
          height={a.rect.height + 8}
          stroke="#00d2ff"
          strokeWidth={1}
          dash={[4, 4]}
          listening={false}
        />
      )}
    </>
  );
}
