import sizes from "../image-dimensions.json";
export function ImageAsset({ src, className = "", ...props }) {
  const [width, height] = sizes[src.split("/").pop()] || [1200, 800];
  return (
    <img
      {...props}
      src={src}
      width={width}
      height={height}
      className={[className, height > width ? "portrait" : ""]
        .filter(Boolean)
        .join(" ")}
    />
  );
}
