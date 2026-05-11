import type { Metadata } from "next";
import TransferFlows from "@/components/TransferFlows/TransferFlows";

export const metadata: Metadata = {
  title: "Transfer Flows | Intelligence",
  description: "Visualise which countries send players to Europe's top five leagues.",
};

export default function TransferFlowsPage() {
  return <TransferFlows />;
}
