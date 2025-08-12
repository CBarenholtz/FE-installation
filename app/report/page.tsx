"use client"
import ReportDetailPage from "@/components/report-detail-page"
import { ReportProvider } from "@/lib/report-context"
import type { InstallationData } from "@/lib/types"

// Sample data to demonstrate the quantity formatting fix
const sampleData: InstallationData[] = [
  {
    Unit: "A01",
    "Kitchen Aerator": "2", // This will show "1.0 GPM (2)"
    "Bathroom aerator": "2", // This will show "1.0 GPM (2)"
    "Shower Head": "1", // This will show "1.75 GPM"
    "Leak Issue Kitchen Faucet": "",
    "Leak Issue Bath Faucet": "",
    "Tub Spout/Diverter Leak Issue": "",
    Notes: "We replaced both toilets.",
  },
  {
    Unit: "A02",
    "Kitchen Aerator": "1", // This will show "1.0 GPM"
    "Bathroom aerator": "1", // This will show "1.0 GPM"
    "Shower Head": "2", // This will show "1.75 GPM (2)"
    "Leak Issue Kitchen Faucet": "",
    "Leak Issue Bath Faucet": "",
    "Tub Spout/Diverter Leak Issue": "",
    Notes: "We replaced toilet.",
  },
]

export default function Page() {
  return (
    <ReportProvider>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Water Installation Report - Quantity Fix Demo</h1>
        <p className="mb-4 text-gray-600">
          This demonstrates the quantity formatting fix. When 2 items are installed, it now shows "(2)" in parentheses
          like "1.0 GPM (2)" instead of just "1.0 GPM".
        </p>
        <ReportDetailPage installationData={sampleData} isPreview={true} isEditable={true} />
      </div>
    </ReportProvider>
  )
}
