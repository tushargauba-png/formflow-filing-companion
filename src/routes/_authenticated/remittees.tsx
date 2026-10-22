import { createFileRoute } from "@tanstack/react-router";
import { remitteesQuery } from "@/lib/queries";
import { MasterPage } from "@/components/master-page";

export const Route = createFileRoute("/_authenticated/remittees")({
  head: () => ({ meta: [{ title: "Remittees — Form 146 Desk" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(remitteesQuery()),
  component: () => (
    <MasterPage title="Remittees" eyebrow="Payee master" table="remittees" query={remitteesQuery() as never}
      listCols={["nickname", "name", "country", "tin", "purpose_code"]}
      fields={[
        { key: "nickname", label: "Nickname", required: true }, { key: "name", label: "Legal name", required: true },
        { key: "country", label: "Country" }, { key: "tin", label: "Tax ID (TIN)" }, { key: "address", label: "Address", type: "textarea" },
        { key: "email", label: "Email" }, { key: "nature_of_remittance", label: "Default nature of remittance" },
        { key: "pan", label: "PAN (if available)" }, { key: "phone", label: "Contact number" }, { key: "principal_place", label: "Principal place of business" }, { key: "trc_number", label: "TRC number" },
        { key: "purpose_code", label: "Default RBI purpose code" }, { key: "dtaa_article", label: "DTAA article" },
        { key: "trc_available", label: "TRC available", type: "bool" }, { key: "form_10f", label: "Form 10F on file", type: "bool" },
        { key: "pe_in_india", label: "PE in India", type: "bool" }, { key: "notes", label: "Notes", type: "textarea" },
      ]} />
  ),
});
