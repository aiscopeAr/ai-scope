interface ToolLogoProps {
  name: string;
  logoUrl: string | null;
  size?: number;
}

export default function ToolLogo({ name, logoUrl, size = 14 }: ToolLogoProps) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={name}
        style={{ width: size * 4, height: size * 4, objectFit: "contain", borderRadius: 10, background: "#f8fafc", border: "1px solid #e2e8f0", padding: 6 }}
      />
    );
  }
  return (
    <div style={{
      width: size * 4, height: size * 4, borderRadius: 10,
      background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontWeight: 700, fontSize: size,
    }}>
      {name[0]}
    </div>
  );
}
