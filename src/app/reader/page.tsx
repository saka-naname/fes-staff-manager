import { StudentCardReader } from "@/app/components/reader";
import { Metadata } from "next";
import { headers } from "next/headers";

export const metadata: Metadata = {
  title: "Card Reader | Fes Staff App",
};

export default function Reader() {
  const headersList = headers();
  const csrfToken = headersList.get("X-CSRF-Token") || "missing";

  return (
    <>
      <StudentCardReader csrfToken={csrfToken} />
    </>
  );
}
