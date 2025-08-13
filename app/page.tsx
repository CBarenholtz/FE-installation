"use client"

import type React from "react"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

// Loading component - separate component for loading state
function LoadingState() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  )
}

// No data component - separate component for no data state
function NoDataState({ onDataProcessed }: { onDataProcessed: (data: any) => void }) {
  return <UploadForm onDataProcessed={onDataProcessed} />
}

// Report view component - separate component for the actual report
function ReportView({
  customerInfo,
  installationData,
  toiletCount,
  notes,
  onBack,
  handleClearAllData,
}: {
  customerInfo: CustomerInfo
  installationData: InstallationData[]
  toiletCount: number
  notes: Note[]
  onBack: () => void
  handleClearAllData: () => void
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

  useEffect(() => {
    console.log("ReportView: Components loaded successfully")
    console.log("ReportView: ExcelExportButton available:", !!ExcelExportButton)
    console.log("ReportView: ImageUpload available:", !!ImageUpload)
    console.log("ReportView: ReportPicturesPage available:", !!ReportPicturesPage)
  }, [])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8 print:hidden">
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack} className="bg-white hover:bg-gray-50">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Form
          </Button>
          <Button variant="destructive" onClick={handleClearAllData} className="text-xs">
            Clear All Data
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {ExcelExportButton ? (
            <ExcelExportButton
              customerInfo={customerInfo}
              installationData={installationData}
              toiletCount={toiletCount}
              notes={notes}
            />
          ) : (
            <div className="text-red-500 text-sm">Excel Export Not Available</div>
          )}
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
          <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full">
            <TabsTrigger value="cover" className="text-xs md:text-sm">
              Cover
            </TabsTrigger>
            <TabsTrigger value="letter" className="text-xs md:text-sm">
              Letter
            </TabsTrigger>
            <TabsTrigger value="notes" className="text-xs md:text-sm">
              Notes
            </TabsTrigger>
            <TabsTrigger value="details" className="text-xs md:text-sm">
              Details
            </TabsTrigger>
            {ImageUpload && ReportPicturesPage ? (
              <TabsTrigger value="pictures" className="text-xs md:text-sm">
                Pictures
              </TabsTrigger>
            ) : (
              <div className="text-red-500 text-xs p-2">Pictures Unavailable</div>
            )}
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
              {ImageUpload ? (
                <ImageUpload
                  onImagesUploaded={handleImagesUploaded}
                  existingImages={images}
                  installationData={installationData}
                  notes={notes}
                />
              ) : (
                <div className="text-red-500 p-4 border rounded">
                  Image Upload component not available. Check console for errors.
                </div>
              )}

              {images.length > 0 && ReportPicturesPage && (
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

function UploadForm({ onDataProcessed }: { onDataProcessed: (data: any) => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    propertyAddress: "",
    propertyManager: "",
    contactInfo: "",
    date: new Date().toISOString().split("T")[0],
  })
  const [processing, setProcessing] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
    }
  }

  const handleCustomerInfoChange = (field: keyof CustomerInfo, value: string) => {
    setCustomerInfo((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !customerInfo.propertyAddress) {
      alert("Please select an Excel file and fill in the property address.")
      return
    }

    setProcessing(true)
    try {
      const result = await parseExcelFile(file)

      // Store data in localStorage
      localStorage.setItem("installationData", JSON.stringify(result.data))
      localStorage.setItem("toiletCount", JSON.stringify(result.toiletCount))
      localStorage.setItem("customerInfo", JSON.stringify(customerInfo))

      onDataProcessed({
        installationData: result.data,
        toiletCount: result.toiletCount,
        customerInfo,
      })
    } catch (error) {
      console.error("Error processing file:", error)
      alert("Error processing Excel file. Please check the file format and try again.")
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Water Installation Report Generator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="excel-file">Excel File</Label>
              <Input id="excel-file" type="file" accept=".xlsx,.xls" onChange={handleFileChange} required />
              <p className="text-sm text-muted-foreground">Upload your water installation data Excel file</p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Customer Information</h3>

              <div className="space-y-2">
                <Label htmlFor="property-address">Property Address *</Label>
                <Input
                  id="property-address"
                  value={customerInfo.propertyAddress}
                  onChange={(e) => handleCustomerInfoChange("propertyAddress", e.target.value)}
                  placeholder="Enter property address"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="property-manager">Property Manager</Label>
                <Input
                  id="property-manager"
                  value={customerInfo.propertyManager}
                  onChange={(e) => handleCustomerInfoChange("propertyManager", e.target.value)}
                  placeholder="Enter property manager name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-info">Contact Information</Label>
                <Input
                  id="contact-info"
                  value={customerInfo.contactInfo}
                  onChange={(e) => handleCustomerInfoChange("contactInfo", e.target.value)}
                  placeholder="Enter contact information"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={customerInfo.date}
                  onChange={(e) => handleCustomerInfoChange("date", e.target.value)}
                />
              </div>
            </div>

            <Button type="submit" disabled={processing} className="w-full">
              {processing ? "Processing..." : "Generate Report"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

// Main content component
function ReportContent() {
  const router = useRouter()
  const { customerInfo, toiletCount, setToiletCount, notes, setNotes, setCustomerInfo } = useReportContext()

  const [installationData, setInstallationData] = useState<InstallationData[]>([])
  const [loading, setLoading] = useState(true)
  const [csvSchema, setCsvSchema] = useState<any[]>([])
  const [filteredData, setFilteredData] = useState<InstallationData[]>([])
  const [reportNotes, setReportNotes] = useState<Note[]>([])

  const handleDataProcessed = (data: any) => {
    setInstallationData(data.installationData)
    setToiletCount(data.toiletCount)
    setCustomerInfo(data.customerInfo)
    setLoading(false)
  }

  const handleBack = () => {
    console.log("Back button clicked - resetting to upload form")
    try {
      setInstallationData([])
      setToiletCount(0)
      setCustomerInfo(null)
      setLoading(false)
      console.log("State reset to show original upload form")
    } catch (error) {
      console.error("Error in handleBack:", error)
      // Fallback: reload the page
      window.location.reload()
    }
  }

  const handleClearAllData = () => {
    console.log("Clear all data button clicked")
    try {
      // Clear localStorage data to ensure fresh start
      localStorage.removeItem("installationData")
      localStorage.removeItem("toiletCount")
      localStorage.removeItem("customerInfo")
      localStorage.removeItem("reportImages")
      localStorage.removeItem("reportNotes")
      console.log("Cleared all localStorage data")

      // Reset state to show upload form
      setInstallationData([])
      setToiletCount(0)
      setCustomerInfo(null)
      setLoading(false)
    } catch (error) {
      console.error("Error in handleClearAllData:", error)
      // Fallback: reload the page to root
      window.location.href = "/"
    }
  }

  // Load data from localStorage
  const loadData = useCallback(() => {
    try {
      console.log("Loading data from localStorage...")

      const storedInstallationData = localStorage.getItem("installationData")
      const storedToiletCount = localStorage.getItem("toiletCount")
      const storedCustomerInfo = localStorage.getItem("customerInfo")

      console.log("Stored installation data exists:", !!storedInstallationData)
      console.log("Stored toilet count exists:", !!storedToiletCount)
      console.log("Stored customer info exists:", !!storedCustomerInfo)

      const isValidJSON = (str: string | null): boolean => {
        if (!str || str === "undefined" || str === "null") return false
        try {
          JSON.parse(str)
          return true
        } catch {
          return false
        }
      }

      if (
        storedInstallationData &&
        storedToiletCount &&
        isValidJSON(storedInstallationData) &&
        isValidJSON(storedToiletCount)
      ) {
        const parsedInstallationData = JSON.parse(storedInstallationData)
        const parsedToiletCount = JSON.parse(storedToiletCount)

        console.log("Parsed installation data length:", parsedInstallationData?.length || 0)
        console.log("Parsed toilet count:", parsedToiletCount)

        setInstallationData(parsedInstallationData)
        setToiletCount(parsedToiletCount)

        if (storedCustomerInfo && isValidJSON(storedCustomerInfo)) {
          const parsedCustomerInfo = JSON.parse(storedCustomerInfo)
          setCustomerInfo(parsedCustomerInfo)
        }

        // Log the schema of the CSV data
        if (parsedInstallationData && parsedInstallationData.length > 0) {
          const firstItem = parsedInstallationData[0]
          const schema = Object.keys(firstItem).map((key) => ({
            name: key,
            type: typeof firstItem[key],
            exampleValue: firstItem[key],
          }))
          setCsvSchema(schema)
          console.log("CSV schema loaded:", schema.length, "columns")
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

        console.log("Report: Generated notes from installation data:", notes.length, "notes")
        setReportNotes(notes)

        console.log("Data loading completed successfully")
      } else {
        console.log("Missing or invalid data in localStorage:")
        console.log(
          "- Installation data missing/invalid:",
          !storedInstallationData || !isValidJSON(storedInstallationData),
        )
        console.log("- Toilet count missing/invalid:", !storedToiletCount || !isValidJSON(storedToiletCount))
        console.log("- Customer info missing/invalid:", !storedCustomerInfo || !isValidJSON(storedCustomerInfo))

        if (storedInstallationData && !isValidJSON(storedInstallationData)) {
          localStorage.removeItem("installationData")
        }
        if (storedToiletCount && !isValidJSON(storedToiletCount)) {
          localStorage.removeItem("toiletCount")
        }
        if (storedCustomerInfo && !isValidJSON(storedCustomerInfo)) {
          localStorage.removeItem("customerInfo")
        }
      }
    } catch (error) {
      console.error("Error loading data:", error)
      console.error("Error details:", error.message)

      localStorage.removeItem("installationData")
      localStorage.removeItem("toiletCount")
      localStorage.removeItem("customerInfo")
      localStorage.removeItem("reportImages")
    } finally {
      setLoading(false)
      console.log("Loading state set to false")
    }
  }, [setToiletCount, setCustomerInfo])

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
    console.log("Rendering loading state")
    return <LoadingState />
  }

  if (!customerInfo || installationData.length === 0) {
    console.log("Rendering upload form:")
    console.log("- Customer info exists:", !!customerInfo)
    console.log("- Installation data length:", installationData.length)
    return <NoDataState onDataProcessed={handleDataProcessed} />
  }

  console.log("Rendering report view with data")
  return (
    <ReportView
      customerInfo={customerInfo}
      installationData={filteredData}
      toiletCount={toiletCount}
      notes={notes}
      onBack={handleBack}
      handleClearAllData={handleClearAllData}
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
