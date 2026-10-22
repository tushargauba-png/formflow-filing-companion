import { pageMeta } from "@/lib/page-meta";
import { createFileRoute } from "@tanstack/react-router";
import { formsQuery, remitteesQuery } from "@/lib/queries";
import { MasterPage } from "@/components/master-page";
import { RemitteeMerge } from "@/components/remittee-merge";
import { validateRemittee } from "@/lib/validation";

export const Route = createFileRoute("/_authenticated/remittees")({
  head: () => pageMeta("Remittees", "Maintain recipient particulars, residence details and tax documentation."),
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(remitteesQuery()), context.queryClient.ensureQueryData(formsQuery())]),
  component: () => (
    <MasterPage title="Remittees" eyebrow="Payee master" table="remittees" query={remitteesQuery() as never}
      listCols={["nickname", "name", "country", "tin", "purpose_code"]} validate={validateRemittee as never} extraActions={<RemitteeMerge />}
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
