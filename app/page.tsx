import { DiscoveryApp } from "@/components/DiscoveryApp";
import { loadDocuments } from "@/lib/data/loadDocuments";

export default function Page() {
  const documents = loadDocuments();

  return <DiscoveryApp documents={documents} />;
}
