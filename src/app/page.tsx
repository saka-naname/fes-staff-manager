import { headers } from "next/headers";
import { GroupView } from "./components/groupView";

export default function Home() {
  const headersList = headers();
  const csrfToken = headersList.get("X-CSRF-Token") || "missing";

  return (
    <main>
      <GroupView csrfToken={csrfToken} />
    </main>
  );
}
