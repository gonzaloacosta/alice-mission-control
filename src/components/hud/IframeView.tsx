interface IframeViewProps {
  src: string;
  title: string;
}

export function IframeView({ src, title }: IframeViewProps) {
  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <iframe
        src={src}
        title={title}
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          borderRadius: "8px",
          background: "#020208",
        }}
        allow="fullscreen"
      />
    </div>
  );
}
