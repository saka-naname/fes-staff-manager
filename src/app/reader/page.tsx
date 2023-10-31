import { StudentCardReader } from "@/app/components/reader";
import { headers } from "next/headers";

export default function Reader() {
  const headersList = headers();
  const csrfToken = headersList.get("X-CSRF-Token") || "missing";

  return (
    <>
      <StudentCardReader csrfToken={csrfToken} />
    </>
  );
}
