export default function PlatformLogo({
  platform,
  size = 16,
}: {
  platform: string;
  size?: number;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        background: "#ccc",
        borderRadius: "50%",
      }}
    />
  );
}
