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

function UploadForm({ onDataLoaded }: { onDataLoaded: () => void }) {
  const { setCustomerInfo, setToiletCount } = useReportContext()
  const [file, setFile] = useState<File | null>(null)
  const [customerData, setCustomerData] = useState({
    propertyAddress: "",
    propertyManager: "",
    contactInfo: "",
    date: new Date().toISOString().split("T")[0],
  })
  const [loading, setLoading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setLoading(true)
    try {
      const result = await parseExcelFile(file)

      // Store data in localStorage
      localStorage.setItem("installationData", JSON.stringify(result.data))
      localStorage.setItem("toiletCount", JSON.stringify(result.toiletCount))

      // Store customer info
      const customerInfo: CustomerInfo = {
        propertyAddress: customerData.propertyAddress,
        propertyManager: customerData.propertyManager,
        contactInfo: customerData.contactInfo,
        date: customerData.date,
      }
      localStorage.setItem("customerInfo", JSON.stringify(customerInfo))

      // Update context
      setCustomerInfo(customerInfo)
      setToiletCount(result.toiletCount)

      // Trigger data reload
      onDataLoaded()
    } catch (error) {
      console.error("Error processing file:", error)
      alert("Error processing Excel file. Please check the file format.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Water Conservation Report Generator</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="file">Excel File</Label>
              <Input id="file" type="file" accept=".xlsx,.xls" onChange={handleFileChange} required />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="propertyAddress">Property Address</Label>
                <Input
                  id="propertyAddress"
                  value={customerData.propertyAddress}
                  onChange={(e) => setCustomerData((prev) => ({ ...prev, propertyAddress: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="propertyManager">Property Manager</Label>
                <Input
                  id="propertyManager"
                  value={customerData.propertyManager}
                  onChange={(e) => setCustomerData((prev) => ({ ...prev, propertyManager: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="contactInfo">Contact Information</Label>
                <Input
                  id="contactInfo"
                  value={customerData.contactInfo}
                  onChange={(e) => setCustomerData((prev) => ({ ...prev, contactInfo: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={customerData.date}
                  onChange={(e) => setCustomerData((prev) => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>
            </div>

            <Button type="submit" disabled={!file || loading} className="w-full">
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
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

function NoDataState({ onDataLoaded }: { onDataLoaded: () => void }) {
  return <UploadForm onDataLoaded={onDataLoaded} />
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

function ReportContent() {
  const router = useRouter()
  const { customerInfo, toiletCount, setToiletCount, notes, setNotes, setCustomerInfo } = useReportContext()

  const [installationData, setInstallationData] = useState<InstallationData[]>([])
  const [loading, setLoading] = useState(true)
  const [csvSchema, setCsvSchema] = useState<any[]>([])
  const [filteredData, setFilteredData] = useState<InstallationData[]>([])
  const [reportNotes, setReportNotes] = useState<Note[]>([])

  const handleBack = () => {
    localStorage.removeItem("installationData")
    localStorage.removeItem("toiletCount")
    localStorage.removeItem("customerInfo")
    localStorage.removeItem("reportImages")
    setInstallationData([])
    setToiletCount(0)
    setCustomerInfo(null)
    setLoading(false)
  }

  // Load data from localStorage
  const loadData = useCallback(() => {
    try {
      const storedInstallationData = localStorage.getItem("installationData")
      const storedToiletCount = localStorage.getItem("toiletCount")
      const storedCustomerInfo = localStorage.getItem("customerInfo")

      if (storedInstallationData && storedToiletCount && storedCustomerInfo) {
        const parsedInstallationData = JSON.parse(storedInstallationData)
        const parsedToiletCount = JSON.parse(storedToiletCount)
        const parsedCustomerInfo = JSON.parse(storedCustomerInfo)

        setInstallationData(parsedInstallationData)
        setToiletCount(parsedToiletCount)
        setCustomerInfo(parsedCustomerInfo)

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
    return <LoadingState />
  }

  if (!customerInfo || installationData.length === 0) {
    return <NoDataState onDataLoaded={loadData} />
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
