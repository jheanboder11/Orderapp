import { Marco } from "@/components/Marco";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <Marco rol="ADMINISTRADOR">{children}</Marco>;
}
