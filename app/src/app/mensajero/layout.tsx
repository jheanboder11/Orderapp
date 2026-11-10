import { Marco } from "@/components/Marco";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <Marco rol="MENSAJERO">{children}</Marco>;
}
