import intrinsicSizes from "../image-dimensions.json";
import optimized from "../optimized-images.json";
export function ImageAsset({ src, className = "", sizes, ...props }) {
  const variant = optimized[src];
  const [width, height] = variant
    ? [variant.width, variant.height]
    : intrinsicSizes[src.split("/").pop()] || [1200, 800];
  return (
    <img
      {...props}
      src={variant?.src || src}
      srcSet={variant?.srcSet}
      sizes={
        variant
          ? sizes ||
            "(max-width: 700px) 260px, (max-width: 1100px) 250px, 320px"
          : undefined
      }
      decoding="async"
      width={width}
      height={height}
      className={[className, height > width ? "portrait" : ""]
        .filter(Boolean)
        .join(" ")}
    />
  );
}
