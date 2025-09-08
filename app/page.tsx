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

function LoadingState() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  )
}

function NoDataState({ onBack }: { onBack: () => void }) {
  // Always render UploadForm directly when no data
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
  const [processedData, setProcessedData] = useState<{
    installationData: InstallationData[]
    toiletCount: number
    customerInfo: CustomerInfo
  } | null>(null)
  

  useEffect(() => {
    console.log("[v0] UPLOAD FORM COMPONENT RENDERED - Save button is NOT available here")
    
    // Clear any leftover localStorage data from previous sessions
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
      "rePrefix",
      "dearPrefix",
      "sectionTitles",
      "coverImageSize",
      "unifiedNotes",
      "dataReady"
    ]

    itemsToRemove.forEach((item) => {
      try {
        localStorage.removeItem(item)
      } catch (error) {
        console.error(`Error removing ${item} from localStorage:`, error)
      }
    })

    console.log("[v0] Cleared localStorage on component mount")
  }, [])

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

    // Clear all localStorage data to start fresh for each new report
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
      "rePrefix",
      "dearPrefix",
      "sectionTitles",
      "coverImageSize",
      "unifiedNotes",
      "dataReady"
    ]

    itemsToRemove.forEach((item) => {
      try {
        localStorage.removeItem(item)
      } catch (error) {
        console.error(`Error removing ${item} from localStorage:`, error)
      }
    })

    console.log("[v0] Cleared all localStorage data for new report")

    setIsProcessing(true)

    try {
      console.log("[v0] Starting Excel file processing...")
      const installationData = await parseExcelFile(file)

      if (installationData.length === 0) {
        alert("No valid installation data found in the file")
        setIsProcessing(false)
        return
      }

      console.log("[v0] Excel data loaded, columns available:", Object.keys(installationData[0] || {}))
      console.log("[v0] First row sample:", installationData[0])
      console.log("[v0] Excel processing complete, saving data to localStorage...")

      const customerInfoWithDate = {
        ...customerInfo,
        date: new Date().toLocaleDateString(),
      }

             const toiletCount = installationData.reduce((total, item) => {
         // First, try to find "Toilets Installed:" columns (these are the primary source)
         const toiletsInstalledColumns = Object.keys(item).filter(key => 
           key.startsWith("Toilets Installed") || key.startsWith("toilets installed") || key.startsWith("toilets replaced")|| key.startsWith("Toilets Replaced")
         )
         
         let toiletQty = 0
         
         // Check if any of these columns contain a total number in the header
         for (const col of toiletsInstalledColumns) {
           // Extract the number from the column header (e.g., "Toilets Installed: 361" -> 361)
           const headerMatch = col.match(/Toilets Installed:\s*(\d+)/i)
           if (headerMatch) {
             const headerNumber = parseInt(headerMatch[1], 10)
             if (!isNaN(headerNumber)) {
               console.log(`[v0] Found total toilet count in header "${col}": ${headerNumber}`)
               return headerNumber // Return this total immediately, don't sum rows
             }
           }
         }
         
         // If no header number found, sum up the values from unit rows only
         // Skip rows that look like headers or totals (e.g., no Unit field, or Unit is "Total")
         if (item.Unit && item.Unit.toString().toLowerCase() !== 'total' && !item.Unit.toString().toLowerCase().includes('total')) {
           for (const col of toiletsInstalledColumns) {
             const value = item[col]
             if (value !== undefined && value !== null && value !== "") {
               const parsed = Number.parseInt(String(value), 10)
               if (!isNaN(parsed)) {
                 toiletQty += parsed
                 console.log(`[v0] Found toilet count in unit row "${item.Unit}", column "${col}": ${value} -> ${parsed}`)
               }
             }
           }
           
           // If no "Toilets Installed:" columns found, try generic toilet columns as fallback
           if (toiletQty === 0) {
             const possibleColumns = ["Toilet", "toilet", "TOILET", "Toilets", "toilets", "TOILETS"]
             
             for (const col of possibleColumns) {
               if (item[col] !== undefined && item[col] !== null && item[col] !== "") {
                 const parsed = Number.parseInt(String(item[col]), 10)
                 if (!isNaN(parsed)) {
                   toiletQty = parsed
                   console.log(`[v0] Found toilet count in fallback column "${col}": ${item[col]} -> ${parsed}`)
                   break
                 }
               }
             }
           }
         } else {
           console.log(`[v0] Skipping header/total row: ${item.Unit}`)
         }
         
         console.log("[v0] Toilet count calculation for unit:", {
           unit: item.Unit || "Unknown",
           toiletsInstalledColumns: toiletsInstalledColumns,
           toiletQty: toiletQty,
           runningTotal: total + toiletQty
         })
         
         return total + toiletQty
       }, 0)

      console.log("[v0] Final toilet count calculated:", toiletCount)

      // If no toilet count found, set a fallback value
      const finalToiletCount = toiletCount > 0 ? toiletCount : installationData.length
      console.log("[v0] Final toilet count with fallback:", finalToiletCount)

      localStorage.setItem("rawInstallationData", JSON.stringify(installationData))
      localStorage.setItem("installationData", JSON.stringify(installationData))
      localStorage.setItem("customerInfo", JSON.stringify(customerInfoWithDate))
      localStorage.setItem("toiletCount", JSON.stringify(finalToiletCount))
      localStorage.setItem("dataReady", "true")

      const verifyData = {
        installationData: localStorage.getItem("installationData"),
        customerInfo: localStorage.getItem("customerInfo"),
        toiletCount: localStorage.getItem("toiletCount"),
      }

      console.log("[v0] Data verification after save:", {
        installationDataSaved: !!verifyData.installationData,
        customerInfoSaved: !!verifyData.customerInfo,
        toiletCountSaved: !!verifyData.toiletCount,
        installationDataLength: verifyData.installationData ? JSON.parse(verifyData.installationData).length : 0,
      })

      if (!verifyData.installationData || !verifyData.customerInfo) {
        throw new Error("Failed to save data to localStorage")
      }

      setProcessedData({
        installationData,
        toiletCount: finalToiletCount,
        customerInfo: customerInfoWithDate,
      })

      console.log("[v0] Processed data set:", {
        installationDataLength: installationData.length,
        toiletCount: finalToiletCount,
        customerInfo: customerInfoWithDate
      })

      // Cloud save for whole-report removed by request

      if (coverImage) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const imageData = e.target?.result as string
          localStorage.setItem("coverImage", imageData)
          console.log("[v0] Cover image saved, navigating to CSV preview...")
          // Navigate to CSV preview instead of report view
          router.push("/csv-preview")
        }
        reader.readAsDataURL(coverImage)
      } else {
        console.log("[v0] No cover image, navigating to CSV preview...")
        // Navigate to CSV preview instead of report view
        router.push("/csv-preview")
      }
    } catch (error) {
      console.error("Error processing file:", error)
      alert("Error processing file. Please check the file format and try again.")
      setIsProcessing(false)
    }
  }

  // Whole-report cloud save removed by request

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Water Installation Report Generator</h1>
            {(() => {
              try {
                const hasData = localStorage.getItem("rawInstallationData") && localStorage.getItem("customerInfo")
                if (hasData) {
                  return (
                    <Button 
                      variant="outline" 
                      onClick={() => router.push("/csv-preview")}
                      size="sm"
                    >
                      📊 Data Preview
                    </Button>
                  )
                }
                return null
              } catch (error) {
                return null
              }
            })()}
          </div>

          {processedData && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-green-800">✅ Report Generated Successfully!</h3>
                  <p className="text-green-700">
                    Processed {processedData.installationData.length} units for{" "}
                    {processedData.customerInfo.propertyName}
                  </p>
                  <p className="text-green-700 font-medium">
                    Toilets Installed: {processedData.toiletCount}
                  </p>
                </div>
              </div>
            </div>
          )}

          

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
          
          {/* CSV Preview Button - only show if there's data in localStorage */}
          {(() => {
            try {
              const hasData = localStorage.getItem("rawInstallationData") && localStorage.getItem("customerInfo")
              if (hasData) {
                return (
                  <div className="mt-4 text-center">
                    <Button 
                      variant="outline" 
                      onClick={() => router.push("/csv-preview")}
                      className="w-full"
                    >
                      📊 Review & Configure Data
                    </Button>
                    <p className="text-sm text-muted-foreground mt-2">
                      Review uploaded data and configure how it should be processed
                    </p>
                  </div>
                )
              }
              return null
            } catch (error) {
              return null
            }
          })()}
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

  useEffect(() => {
    console.log("[v0] REPORT VIEW COMPONENT RENDERED")
    console.log("[v0] Customer info available:", !!customerInfo)
    console.log("[v0] Installation data length:", installationData.length)
    console.log("[v0] Toilet count received:", toiletCount)
    console.log("[v0] Toilet count type:", typeof toiletCount)
    console.log("[v0] Notes count:", notes.length)
  }, [])

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

  const handleBackWithSaveOption = () => {
    const hasData = installationData.length > 0 || images.length > 0 || notes.length > 0

    if (hasData) {
      const shouldGoBack = confirm(
        "You have unsaved work. Going back will clear the current report from this session. Continue?",
      )

      if (!shouldGoBack) {
        return
      }
    }

    // Call onBack directly without any intermediate steps
    onBack()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8 print:hidden">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleBackWithSaveOption}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Form
          </Button>
        </div>
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
  const { customerInfo, toiletCount, setToiletCount, notes, setNotes, setCustomerInfo } = useReportContext()

  const [installationData, setInstallationData] = useState<InstallationData[]>([])
  const [loading, setLoading] = useState(true)
  const [csvSchema, setCsvSchema] = useState<any[]>([])
  const [filteredData, setFilteredData] = useState<InstallationData[]>([])
  const [reportNotes, setReportNotes] = useState<Note[]>([])
  const [hasValidData, setHasValidData] = useState(false)
  const [isNavigatingBack, setIsNavigatingBack] = useState(false)

  const handleBack = () => {
    try {
      console.log("[v0] Starting handleBack - navigating directly to form")
      
      // Navigate to form FIRST, before any state changes
      router.push("/")
      
      // Then clear state and localStorage in the background
      setTimeout(() => {
        setIsNavigatingBack(true)
        setInstallationData([])
        setFilteredData([])
        setReportNotes([])
        setToiletCount(0)
        setHasValidData(false)
        setLoading(false)
        
        // Clear localStorage data
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
          "rePrefix",
          "dearPrefix",
          "sectionTitles",
          "coverImageSize",
          "unifiedNotes",
          "dataReady"
        ]

        itemsToRemove.forEach((item) => {
          try {
            localStorage.removeItem(item)
          } catch (error) {
            console.error(`[v0] Error removing ${item} from localStorage:`, error)
          }
        })
        
        console.log("[v0] All state cleared and localStorage cleaned in background")
      }, 100)
      
    } catch (error) {
      console.error("[v0] Error in handleBack:", error)
      // Force navigation even if there's an error
      router.push("/")
    }
  }

    const loadData = useCallback(() => {
    // Don't load data if we're intentionally going back to form
    if (isNavigatingBack) {
      console.log("[v0] Skipping data load - navigating back to form")
      setLoading(false)
      return
    }

    try {
      console.log("[v0] Loading data from localStorage for current session")

      const storedInstallationData =
        localStorage.getItem("installationData") || localStorage.getItem("rawInstallationData")
      const storedToiletCount = localStorage.getItem("toiletCount")
      const storedCustomerInfo = localStorage.getItem("customerInfo")

      console.log("[v0] Raw localStorage check:", {
        installationDataExists: !!storedInstallationData,
        installationDataLength: storedInstallationData ? JSON.parse(storedInstallationData).length : 0,
        toiletCountExists: !!storedToiletCount,
        toiletCountRawValue: storedToiletCount,
        customerInfoExists: !!storedCustomerInfo,
        customerInfoLength: storedCustomerInfo ? storedCustomerInfo.length : 0,
      })

      let hasCustomerData = false
      let hasInstallationDataLoaded = false

      if (storedCustomerInfo) {
        try {
          const parsedCustomerInfo = JSON.parse(storedCustomerInfo)
          setCustomerInfo(parsedCustomerInfo)
          console.log("[v0] Loaded customerInfo into context:", parsedCustomerInfo.customerName)
          hasCustomerData = true
        } catch (error) {
          console.error("[v0] Error parsing customerInfo:", error)
        }
      }

      if (storedInstallationData) {
        try {
          const parsedInstallationData = JSON.parse(storedInstallationData)
          const parsedToiletCount = storedToiletCount ? JSON.parse(storedToiletCount) : 0

          console.log("[v0] Parsed installation data:", {
            installationDataLength: parsedInstallationData.length,
            toiletCount: parsedToiletCount,
            toiletCountType: typeof parsedToiletCount,
            firstUnit: parsedInstallationData[0]?.Unit || "N/A",
          })

          if (parsedInstallationData.length > 0) {
            setInstallationData(parsedInstallationData)
            setToiletCount(parsedToiletCount)
            hasInstallationDataLoaded = true

            console.log("[v0] Set toilet count in context:", parsedToiletCount)
            console.log("[v0] Set installation data:", parsedInstallationData.length, "items")

            const firstItem = parsedInstallationData[0]
            const schema = Object.keys(firstItem).map((key) => ({
              name: key,
              type: typeof firstItem[key],
              exampleValue: firstItem[key],
            }))
            setCsvSchema(schema)
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
                if (item["Tub Spout/Diverter Leak Issue"] === "Light")
                  noteText += "Light leak from tub spout/ diverter. "
                if (item["Tub Spout/Diverter Leak Issue"] === "Moderate")
                  noteText += "Moderate leak from tub spout/diverter. "
                if (item["Tub Spout/Diverter Leak Issue"] === "Heavy")
                  noteText += "Heavy leak from tub spout/ diverter. "

                if (item.Notes && item.Notes.trim() !== "") {
                  noteText += item.Notes + " "
                }

                return {
                  unit: item.Unit,
                  note: noteText.trim(),
                }
              })
              .filter((note: Note) => note.note !== "")

            setReportNotes(notes)
            console.log("[v0] Generated notes from installation data:", notes.length)
          }
        } catch (error) {
          console.error("[v0] Error parsing installation data:", error)
        }
      }

      const dataLoaded = hasCustomerData || hasInstallationDataLoaded
      setHasValidData(dataLoaded)

      console.log("[v0] Final data loading result:", {
        hasValidData: dataLoaded,
        hasCustomerInfo: hasCustomerData,
        hasInstallationData: hasInstallationDataLoaded,
        installationDataLength: storedInstallationData ? JSON.parse(storedInstallationData).length : 0,
      })

      if (!dataLoaded) {
        console.log("[v0] No valid data found, staying in UploadForm")
        setInstallationData([])
        setFilteredData([])
        setReportNotes([])
        setToiletCount(0)
        setHasValidData(false)
      } else {
        console.log("[v0] Valid data found, switching to ReportView")
        setHasValidData(true)
      }
    } catch (error) {
      console.error("[v0] Error loading data:", error)
      setInstallationData([])
      setFilteredData([])
      setReportNotes([])
      setToiletCount(0)
      setHasValidData(false)
    } finally {
      setLoading(false)
    }
  }, [setToiletCount, setCustomerInfo, isNavigatingBack])

  useEffect(() => {
    // Only load data if we're not intentionally going back to form
    if (!isNavigatingBack) {
      loadData()
    }
  }, [loadData, isNavigatingBack])

  useEffect(() => {
    if (JSON.stringify(reportNotes) !== JSON.stringify(notes)) {
      setNotes(reportNotes)
    }
  }, [reportNotes, notes, setNotes])

  if (loading) {
    return <LoadingState />
  }

  if (!hasValidData) {
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
