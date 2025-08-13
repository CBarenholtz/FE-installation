"use client"

import type React from "react"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { ChevronLeft, Upload } from "lucide-react"
import ReportCoverPage from "@/components/report-cover-page"
import ReportLetterPage from "@/components/report-letter-page"
import ReportNotesPage from "@/components/report-notes-page"
import ReportDetailPage from "@/components/report-detail-page"
import EnhancedPdfButton from "@/components/enhanced-pdf-button"
import ExcelExportButton from "@/components/excel-export-button"
import ImageUpload from "@/components/image-upload"
import ReportPicturesPage from "@/components/report-pictures-page"
import { ReportProvider, useReportContext } from "@/lib/report-context"
import { parseExcelFile } from "@/lib/excel-parser"
import type { CustomerInfo, InstallationData, Note, ImageData } from "@/lib/types"

function UploadForm() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [customerInfo, setCustomerInfo] = useState({
    customerName: "",
    propertyName: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    unitType: "Unit" as "Unit" | "Room",
  })
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
    }
  }

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setCoverImage(selectedFile)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      alert("Please select a file to upload")
      return
    }

    if (!customerInfo.customerName || !customerInfo.propertyName || !customerInfo.address) {
      alert("Please fill in all required customer information fields")
      return
    }

    setIsProcessing(true)

    try {
      // Parse the Excel file
      const installationData = await parseExcelFile(file)

      if (installationData.length === 0) {
        alert("No valid installation data found in the file")
        setIsProcessing(false)
        return
      }

      // Count toilets
      const toiletCount = installationData.filter((item) => {
        const toiletColumn = Object.keys(item).find((key) => key.startsWith("Toilets Installed:"))
        return toiletColumn && item[toiletColumn] && item[toiletColumn] !== ""
      }).length

      // Store data in localStorage
      localStorage.setItem("installationData", JSON.stringify(installationData))
      localStorage.setItem("toiletCount", JSON.stringify(toiletCount))
      localStorage.setItem("customerInfo", JSON.stringify(customerInfo))

      // Handle cover image if provided
      if (coverImage) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const imageData = e.target?.result as string
          localStorage.setItem("coverImage", imageData)
          // Navigate to report view
          window.location.reload()
        }
        reader.readAsDataURL(coverImage)
      } else {
        // Navigate to report view
        window.location.reload()
      }
    } catch (error) {
      console.error("Error processing file:", error)
      alert("Error processing file. Please check the file format and try again.")
      setIsProcessing(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardContent className="pt-6">
          <h1 className="text-2xl font-bold mb-6">Water Installation Report Generator</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Customer Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerName">Customer Name *</Label>
                  <Input
                    id="customerName"
                    value={customerInfo.customerName}
                    onChange={(e) => setCustomerInfo((prev) => ({ ...prev, customerName: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="propertyName">Property Name *</Label>
                  <Input
                    id="propertyName"
                    value={customerInfo.propertyName}
                    onChange={(e) => setCustomerInfo((prev) => ({ ...prev, propertyName: e.target.value }))}
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="address">Address *</Label>
                  <Input
                    id="address"
                    value={customerInfo.address}
                    onChange={(e) => setCustomerInfo((prev) => ({ ...prev, address: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={customerInfo.city}
                    onChange={(e) => setCustomerInfo((prev) => ({ ...prev, city: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={customerInfo.state}
                    onChange={(e) => setCustomerInfo((prev) => ({ ...prev, state: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="zip">ZIP Code</Label>
                  <Input
                    id="zip"
                    value={customerInfo.zip}
                    onChange={(e) => setCustomerInfo((prev) => ({ ...prev, zip: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="unitType">Unit Type</Label>
                  <select
                    id="unitType"
                    value={customerInfo.unitType}
                    onChange={(e) =>
                      setCustomerInfo((prev) => ({ ...prev, unitType: e.target.value as "Unit" | "Room" }))
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="Unit">Unit</option>
                    <option value="Room">Room</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Cover Image Upload */}
            <div>
              <Label htmlFor="coverImage">Cover Image (Optional)</Label>
              <Input id="coverImage" type="file" accept="image/*" onChange={handleCoverImageChange} />
            </div>

            {/* File Upload */}
            <div>
              <Label htmlFor="file">Excel/CSV File *</Label>
              <Input id="file" type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} required />
            </div>

            <Button type="submit" disabled={isProcessing} className="w-full">
              {isProcessing ? (
                <>Processing...</>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Generate Report
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

// Loading component - separate component for loading state
function LoadingState() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  )
}

function NoDataState({ onBack }: { onBack: () => void }) {
  return <UploadForm />
}

// Report view component - separate component for the actual report
function ReportView({
  customerInfo,
  installationData,
  toiletCount,
  notes,
  onBack,
}: {
  customerInfo: CustomerInfo
  installationData: InstallationData[]
  toiletCount: number
  notes: Note[]
  onBack: () => void
}) {
  const [currentPage, setCurrentPage] = useState("cover")
  const [images, setImages] = useState<ImageData[]>([])

  useEffect(() => {
    const storedImages = localStorage.getItem("reportImages")
    if (storedImages) {
      try {
        setImages(JSON.parse(storedImages))
      } catch (error) {
        console.error("Error loading images:", error)
      }
    }
  }, [])

  const handleImagesUploaded = (uploadedImages: ImageData[]) => {
    setImages(uploadedImages)
    localStorage.setItem("reportImages", JSON.stringify(uploadedImages))
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8 print:hidden">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Form
        </Button>
        <div className="flex flex-wrap gap-2">
          <ExcelExportButton
            customerInfo={customerInfo}
            installationData={installationData}
            toiletCount={toiletCount}
            notes={notes}
          />
          <EnhancedPdfButton
            customerInfo={customerInfo}
            installationData={installationData}
            toiletCount={toiletCount}
            notes={notes}
          />
        </div>
      </div>

      <div className="print:hidden">
        <Tabs value={currentPage} onValueChange={setCurrentPage}>
          <TabsList className="grid grid-cols-5">
            <TabsTrigger value="cover">Cover Page</TabsTrigger>
            <TabsTrigger value="letter">Letter Page</TabsTrigger>
            <TabsTrigger value="notes">Notes Pages</TabsTrigger>
            <TabsTrigger value="details">Detail Pages</TabsTrigger>
            <TabsTrigger value="pictures">Pictures</TabsTrigger>
          </TabsList>

          <TabsContent value="cover">
            <ReportCoverPage customerInfo={customerInfo} isEditable={true} />
          </TabsContent>

          <TabsContent value="letter">
            <ReportLetterPage customerInfo={customerInfo} toiletCount={toiletCount} isEditable={true} />
          </TabsContent>

          <TabsContent value="notes">
            <ReportNotesPage notes={notes} isPreview={true} isEditable={true} />
          </TabsContent>

          <TabsContent value="details">
            <ReportDetailPage installationData={installationData} isPreview={true} isEditable={true} />
          </TabsContent>

          <TabsContent value="pictures">
            <div className="space-y-6">
              <ImageUpload
                onImagesUploaded={handleImagesUploaded}
                existingImages={images}
                installationData={installationData}
                notes={notes}
              />

              {images.length > 0 && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">Pictures Report Preview</h3>
                  <ReportPicturesPage isPreview={true} isEditable={true} />
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Hidden content for printing - using the same components as the preview but with editing disabled */}
      <div className="hidden print-content">
        <div className="report-page">
          <ReportCoverPage customerInfo={customerInfo} isEditable={false} />
        </div>
        <div className="page-break"></div>
        <div className="report-page">
          <ReportLetterPage customerInfo={customerInfo} toiletCount={toiletCount} isEditable={false} />
        </div>
        <div className="page-break"></div>
        <ReportNotesPage notes={notes} isPreview={false} isEditable={false} />
        <div className="page-break"></div>
        <ReportDetailPage installationData={installationData} isPreview={false} isEditable={false} />
        <div className="page-break"></div>
        <ReportPicturesPage isPreview={false} isEditable={false} />
      </div>
    </div>
  )
}

// Main content component
function ReportContent() {
  const router = useRouter()
  const { customerInfo, toiletCount, setToiletCount, notes, setNotes } = useReportContext()

  const [installationData, setInstallationData] = useState<InstallationData[]>([])
  const [loading, setLoading] = useState(true)
  const [csvSchema, setCsvSchema] = useState<any[]>([])
  const [filteredData, setFilteredData] = useState<InstallationData[]>([])
  const [reportNotes, setReportNotes] = useState<Note[]>([])

  const handleBack = () => {
    router.push("/")
  }

  // Load data from localStorage
  const loadData = useCallback(() => {
    try {
      const storedInstallationData = localStorage.getItem("installationData")
      const storedToiletCount = localStorage.getItem("toiletCount")

      if (storedInstallationData && storedToiletCount) {
        const parsedInstallationData = JSON.parse(storedInstallationData)
        const parsedToiletCount = JSON.parse(storedToiletCount)

        setInstallationData(parsedInstallationData)
        setToiletCount(parsedToiletCount)

        // Log the schema of the CSV data
        if (parsedInstallationData && parsedInstallationData.length > 0) {
          const firstItem = parsedInstallationData[0]
          const schema = Object.keys(firstItem).map((key) => ({
            name: key,
            type: typeof firstItem[key],
            exampleValue: firstItem[key],
          }))
          setCsvSchema(schema)
        }

        // The data is already filtered and sorted from the CSV preview page
        setFilteredData(parsedInstallationData)

        // Group notes for the notes pages - only include leak issues and custom notes
        const notes = parsedInstallationData
          .filter(
            (item: InstallationData) =>
              item["Leak Issue Kitchen Faucet"] ||
              item["Leak Issue Bath Faucet"] ||
              item["Tub Spout/Diverter Leak Issue"] ||
              (item.Notes && item.Notes.trim() !== ""),
          )
          .map((item: InstallationData) => {
            let noteText = ""
            if (item["Leak Issue Kitchen Faucet"]) noteText += "Dripping from kitchen faucet. "
            if (item["Leak Issue Bath Faucet"]) noteText += "Dripping from bathroom faucet. "
            if (item["Tub Spout/Diverter Leak Issue"] === "Light") noteText += "Light leak from tub spout/ diverter. "
            if (item["Tub Spout/Diverter Leak Issue"] === "Moderate")
              noteText += "Moderate leak from tub spout/diverter. "
            if (item["Tub Spout/Diverter Leak Issue"] === "Heavy") noteText += "Heavy leak from tub spout/ diverter. "

            // Add custom notes from CSV preview (this includes selected cells and columns)
            if (item.Notes && item.Notes.trim() !== "") {
              noteText += item.Notes + " "
            }

            return {
              unit: item.Unit,
              note: noteText.trim(),
            }
          })
          .filter((note: Note) => note.note !== "") // Remove notes that are empty after filtering

        console.log("Report: Generated notes from installation data:", notes)
        setReportNotes(notes)
      }
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }, [setToiletCount])

  // Load data on component mount
  useEffect(() => {
    loadData()
  }, [loadData])

  // Update notes in context if they've changed
  useEffect(() => {
    if (JSON.stringify(reportNotes) !== JSON.stringify(notes)) {
      setNotes(reportNotes)
    }
  }, [reportNotes, notes, setNotes])

  // Render appropriate component based on state
  if (loading) {
    return <LoadingState />
  }

  if (!customerInfo || installationData.length === 0) {
    return <NoDataState onBack={handleBack} />
  }

  return (
    <ReportView
      customerInfo={customerInfo}
      installationData={filteredData}
      toiletCount={toiletCount}
      notes={notes}
      onBack={handleBack}
    />
  )
}

export default function ReportPage() {
  return (
    <ReportProvider>
      <ReportContent />
    </ReportProvider>
  )
}
