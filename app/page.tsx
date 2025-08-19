"use client"

import type React from "react"
import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { ChevronLeft, Upload, Save, Download } from "lucide-react"
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
import { saveReportToSupabase, loadReportsFromSupabase } from "@/lib/actions"

interface SavedReport {
  id: string
  propertyName: string
  timestamp: string
  customerName: string
  displayName: string
  url?: string
}

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
  const [savedReports, setSavedReports] = useState<SavedReport[]>([])
  const [selectedReport, setSelectedReport] = useState<string>("")
  const [isLoadingReports, setIsLoadingReports] = useState(false)

  useEffect(() => {
    loadSavedReports()
  }, [])

  const loadSavedReports = async () => {
    try {
      setIsLoadingReports(true)
      console.log("[v0] Loading saved reports using Server Action")

      const result = await loadReportsFromSupabase()

      if (result.success) {
        setSavedReports(result.reports)
        console.log("[v0] Loaded reports via Server Action:", result.reports.length)
      } else {
        console.log("[v0] Error loading reports via Server Action")
        setSavedReports([])
      }
    } catch (error) {
      console.log("[v0] Server Action error:", error)
      setSavedReports([])
    } finally {
      setIsLoadingReports(false)
    }
  }

  const handleLoadReport = async () => {
    if (!selectedReport) return

    try {
      setIsProcessing(true)
      console.log("[v0] Loading specific report using Server Action:", selectedReport)

      const result = await loadReportsFromSupabase()

      if (result.success) {
        const selectedReportData = result.reports.find((report) => report.id === selectedReport)

        if (selectedReportData && selectedReportData.data) {
          const reportData = selectedReportData.data

          if (reportData.customerInfo) {
            localStorage.setItem("customerInfo", JSON.stringify(reportData.customerInfo))
          }
          if (reportData.installationData) {
            localStorage.setItem("installationData", JSON.stringify(reportData.installationData))
            localStorage.setItem("rawInstallationData", JSON.stringify(reportData.installationData))
          }
          if (reportData.toiletCount) {
            localStorage.setItem("toiletCount", JSON.stringify(reportData.toiletCount))
          }
          if (reportData.reportImages) {
            localStorage.setItem("reportImages", JSON.stringify(reportData.reportImages))
          }
          if (reportData.reportNotes) {
            localStorage.setItem("reportNotes", JSON.stringify(reportData.reportNotes))
          }
          if (reportData.coverImage) {
            localStorage.setItem("coverImage", reportData.coverImage)
          }

          console.log("[v0] Report loaded from Supabase using Server Action")
          window.location.reload()
        } else {
          alert("Report not found. Please try again.")
        }
      } else {
        alert("Error loading report. Please try again.")
      }
    } catch (error) {
      console.error("[v0] Error loading report via Server Action:", error)
      alert("Error loading report. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

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
      const installationData = await parseExcelFile(file)

      if (installationData.length === 0) {
        alert("No valid installation data found in the file")
        setIsProcessing(false)
        return
      }

      localStorage.setItem("rawInstallationData", JSON.stringify(installationData))
      localStorage.setItem(
        "customerInfo",
        JSON.stringify({
          ...customerInfo,
          date: new Date().toLocaleDateString(),
        }),
      )

      if (coverImage) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const imageData = e.target?.result as string
          localStorage.setItem("coverImage", imageData)
          router.push("/csv-preview")
        }
        reader.readAsDataURL(coverImage)
      } else {
        router.push("/csv-preview")
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
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Water Installation Report Generator</h1>
          </div>

          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h2 className="text-lg font-semibold mb-3">Load Recent Report (15 Most Recent)</h2>
            {isLoadingReports ? (
              <p className="text-gray-600">Loading saved reports from cloud storage...</p>
            ) : savedReports.length > 0 ? (
              <div className="space-y-3">
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <Label htmlFor="savedReport">Select a recent report to load</Label>
                    <Select value={selectedReport} onValueChange={setSelectedReport}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a saved report..." />
                      </SelectTrigger>
                      <SelectContent>
                        {savedReports.map((report) => (
                          <SelectItem key={report.id} value={report.id}>
                            {report.displayName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={handleLoadReport}
                    disabled={!selectedReport || isProcessing}
                    variant="outline"
                    className="flex items-center gap-2 bg-transparent"
                  >
                    <Download className="h-4 w-4" />
                    {isProcessing ? "Loading..." : "Load Report"}
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-gray-600">No saved reports found. Generate and save a report to see it here.</p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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

            <div>
              <Label htmlFor="coverImage">Cover Image (Optional)</Label>
              <Input id="coverImage" type="file" accept="image/*" onChange={handleCoverImageChange} />
            </div>

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
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState("cover")
  const [images, setImages] = useState<ImageData[]>([])
  const [isSaving, setIsSaving] = useState(false)

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

  const handleSaveReport = async () => {
    try {
      setIsSaving(true)
      console.log("[v0] Saving report using Server Action")

      const reportData = {
        customerInfo,
        installationData,
        toiletCount,
        reportNotes: notes,
        // Exclude large image data that causes Server Action failures
        reportTitle: localStorage.getItem("reportTitle"),
        letterText: localStorage.getItem("letterText"),
        signatureName: localStorage.getItem("signatureName"),
        signatureTitle: localStorage.getItem("signatureTitle"),
      }

      const result = await saveReportToSupabase(reportData)

      if (result.success) {
        console.log("[v0] Report saved via Server Action successfully")
        alert(
          `Report saved to cloud storage!\nProperty: ${customerInfo.propertyName}\nSaved at: ${new Date().toLocaleString()}\n\nYour report is now accessible from any device.`,
        )
        setTimeout(() => {
          onBack()
        }, 100)
      } else {
        throw new Error(result.message || "Failed to save to cloud storage")
      }
    } catch (error) {
      console.error("[v0] Error saving report via Server Action:", error)
      alert("Error saving report to cloud storage. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleBackWithSaveOption = () => {
    const hasData = installationData.length > 0 || images.length > 0 || notes.length > 0

    if (hasData) {
      const shouldSave = confirm(
        "You have unsaved work. Would you like to save this report to cloud storage before going back?\n\nClick OK to save, or Cancel to discard changes.",
      )

      if (shouldSave) {
        handleSaveReport()
        return
      }
    }

    onBack()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8 print:hidden">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleBackWithSaveOption} disabled={isSaving}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Form
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleSaveReport} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving to Cloud..." : "Save to Cloud"}
          </Button>
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
    </div>
  )
}

function ReportContent() {
  const router = useRouter()
  const { customerInfo, toiletCount, setToiletCount, notes, setNotes } = useReportContext()

  const [installationData, setInstallationData] = useState<InstallationData[]>([])
  const [loading, setLoading] = useState(true)
  const [csvSchema, setCsvSchema] = useState<any[]>([])
  const [filteredData, setFilteredData] = useState<InstallationData[]>([])
  const [reportNotes, setReportNotes] = useState<Note[]>([])

  const handleBack = () => {
    try {
      console.log("[v0] Starting handleBack - clearing all localStorage data")

      const itemsToRemove = [
        "installationData",
        "toiletCount",
        "customerInfo",
        "rawInstallationData",
        "coverImage",
        "reportImages",
        "selectedCells",
        "selectedNotesColumns",
        "reportNotes",
        "reportTitle",
        "letterText",
        "signatureName",
        "signatureTitle",
        "editedUnits",
      ]

      itemsToRemove.forEach((item) => {
        try {
          localStorage.removeItem(item)
        } catch (error) {
          console.error(`[v0] Error removing ${item} from localStorage:`, error)
        }
      })

      setInstallationData([])
      setFilteredData([])
      setReportNotes([])
      setToiletCount(0)
      setLoading(true)

      console.log("[v0] All localStorage data cleared and state reset")
    } catch (error) {
      console.error("[v0] Error in handleBack:", error)
      router.push("/")
    }
  }

  const loadData = useCallback(() => {
    try {
      console.log("[v0] Loading data from localStorage for current session")
      const storedInstallationData = localStorage.getItem("installationData")
      const storedToiletCount = localStorage.getItem("toiletCount")

      if (storedInstallationData && storedToiletCount) {
        const parsedInstallationData = JSON.parse(storedInstallationData)
        const parsedToiletCount = JSON.parse(storedToiletCount)

        setInstallationData(parsedInstallationData)
        setToiletCount(parsedToiletCount)

        if (parsedInstallationData && parsedInstallationData.length > 0) {
          const firstItem = parsedInstallationData[0]
          const schema = Object.keys(firstItem).map((key) => ({
            name: key,
            type: typeof firstItem[key],
            exampleValue: firstItem[key],
          }))
          setCsvSchema(schema)
        }

        setFilteredData(parsedInstallationData)

        const notes = parsedInstallationData
          .filter(
            (item: InstallationData) =>
              item["Leak Issue Kitchen Faucet"] ||
              item["Leak Issue Bath Faucet"] ||
              item["Tub Spout/Diverter Leak Issue"] === "Light" ||
              item["Tub Spout/Diverter Leak Issue"] === "Moderate" ||
              item["Tub Spout/Diverter Leak Issue"] === "Heavy" ||
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

            if (item.Notes && item.Notes.trim() !== "") {
              noteText += item.Notes + " "
            }

            return {
              unit: item.Unit,
              note: noteText.trim(),
            }
          })
          .filter((note: Note) => note.note !== "")

        console.log("Report: Generated notes from installation data:", notes)
        setReportNotes(notes)
      } else {
        setInstallationData([])
        setFilteredData([])
        setReportNotes([])
        setToiletCount(0)
      }
    } catch (error) {
      console.error("[v0] Error loading data:", error)
      setInstallationData([])
      setFilteredData([])
      setReportNotes([])
      setToiletCount(0)
    } finally {
      setLoading(false)
    }
  }, [setToiletCount])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (JSON.stringify(reportNotes) !== JSON.stringify(notes)) {
      setNotes(reportNotes)
    }
  }, [reportNotes, notes, setNotes])

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
