import { HomeExperience } from "@/components/HomeExperience";
import { loadDocuments } from "@/lib/data/loadDocuments";

export default function Page() {
  const documents = loadDocuments();

  return <HomeExperience documents={documents} />;
}
