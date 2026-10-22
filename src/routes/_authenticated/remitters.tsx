import { pageMeta } from "@/lib/page-meta";
import { createFileRoute } from "@tanstack/react-router";
import { remittersQuery } from "@/lib/queries";
import { MasterPage } from "@/components/master-page";

export const Route = createFileRoute("/_authenticated/remitters")({
  head: () => pageMeta("Remitters", "Maintain client names, addresses, tax IDs and bank details for Form 146."),
  loader: ({ context }) => context.queryClient.ensureQueryData(remittersQuery()),
  component: () => (
    <MasterPage title="Remitters" eyebrow="Client master" table="remitters" query={remittersQuery() as never}
      listCols={["nickname", "name", "pan", "city", "email"]}
      fields={[
        { key: "nickname", label: "Nickname", required: true }, { key: "name", label: "Legal name", required: true },
        { key: "pan", label: "PAN" }, { key: "tan", label: "TAN" }, { key: "address", label: "Address", type: "textarea" },
        { key: "entity_status", label: "Status (company / individual / other)" }, { key: "residential_status", label: "Residential status" },
        { key: "city", label: "City" }, { key: "state", label: "State" }, { key: "pincode", label: "PIN code" },
        { key: "country", label: "Country" }, { key: "email", label: "Email" }, { key: "phone", label: "Phone" },
        { key: "ao_details", label: "Area code / AO details" }, { key: "bank_name", label: "Bank name" },
        { key: "bank_branch", label: "Bank branch" }, { key: "bsr_code", label: "BSR code" }, { key: "notes", label: "Notes", type: "textarea" },
        { key: "bank_ifsc", label: "IFSC code" },
      ]} />
  ),
});
