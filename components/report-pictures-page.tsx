"use client"

import { useEffect, useState } from "react"
import { useReportContext } from "@/lib/report-context"
import EditableText from "@/components/editable-text"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import type { ImageData, ProcessedImage, InstallationData, Note } from "@/lib/types"
import { processImagesForReport } from "@/lib/utils/image-processor"

interface ReportPicturesPageProps {
  isPreview?: boolean
  isEditable?: boolean
}

export default function ReportPicturesPage({ isPreview = true, isEditable = true }: ReportPicturesPageProps) {
  const { sectionTitles, setSectionTitles } = useReportContext()
  const [images, setImages] = useState<ImageData[]>([])
  const [processedImages, setProcessedImages] = useState<{ [unit: string]: ProcessedImage[] }>({})
  const [installationData, setInstallationData] = useState<InstallationData[]>([])
  const [notes, setNotes] = useState<Note[]>([])

  // Load data from localStorage
  useEffect(() => {
    try {
      // Load images
      const storedImages = localStorage.getItem("reportImages")
      if (storedImages) {
        const parsedImages = JSON.parse(storedImages)
        setImages(parsedImages)
      }

      // Load installation data
      const storedInstallationData = localStorage.getItem("installationData")
      if (storedInstallationData) {
        const parsedInstallationData = JSON.parse(storedInstallationData)
        setInstallationData(parsedInstallationData)
      }

      // Load notes
      const storedNotes = localStorage.getItem("reportNotes")
      if (storedNotes) {
        const parsedNotes = JSON.parse(storedNotes)
        setNotes(parsedNotes)
      }
    } catch (error) {
      console.error("Error loading pictures data:", error)
    }
  }, [])

  // Process images when data changes
  useEffect(() => {
    if (images.length > 0 && installationData.length > 0) {
      const processed = processImagesForReport(images, installationData, notes)
      setProcessedImages(processed)
    }
  }, [images, installationData, notes])

  // Handle section title change
  const handleSectionTitleChange = (value: string) => {
    if (isEditable) {
      setSectionTitles((prev) => {
        const updated = { ...prev, pictures: value }
        localStorage.setItem("sectionTitles", JSON.stringify(updated))
        return updated
      })
    }
  }

  // Handle image caption change
  const handleCaptionChange = (imageId: string, newCaption: string) => {
    if (isEditable) {
      const updatedImages = images.map((img) => (img.id === imageId ? { ...img, caption: newCaption } : img))
      setImages(updatedImages)
      localStorage.setItem("reportImages", JSON.stringify(updatedImages))
    }
  }

  // Handle image unit change
  const handleUnitChange = (imageId: string, newUnit: string) => {
    if (isEditable) {
      const updatedImages = images.map((img) => (img.id === imageId ? { ...img, unit: newUnit.toUpperCase() } : img))
      setImages(updatedImages)
      localStorage.setItem("reportImages", JSON.stringify(updatedImages))
    }
  }

  // Remove image
  const handleRemoveImage = (imageId: string) => {
    if (isEditable) {
      const updatedImages = images.filter((img) => img.id !== imageId)
      setImages(updatedImages)
      localStorage.setItem("reportImages", JSON.stringify(updatedImages))
    }
  }

  // Get the section title from context or use default
  const picturesTitle = sectionTitles.pictures || "Installation Pictures"

  // Sort units for consistent display
  const sortedUnits = Object.keys(processedImages).sort((a, b) => {
    const numA = Number.parseInt(a)
    const numB = Number.parseInt(b)
    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB
    }
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
  })

  // Split images into pages (6 images per page for good layout)
  const imagesPerPage = 6
  const allImages = sortedUnits.flatMap((unit) => processedImages[unit])
  const imagePages = []

  for (let i = 0; i < allImages.length; i += imagesPerPage) {
    imagePages.push(allImages.slice(i, i + imagesPerPage))
  }

  // If no images, show empty state
  if (allImages.length === 0) {
    return (
      <div className="report-page min-h-[1056px] relative">
        {/* Header with logo */}
        <div className="mb-8">
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-04-29%20115501-BD1uw5tVq9PtVYW6Z6FKM1i8in6GeV.png"
            alt="GreenLight Logo"
            className="h-24"
            crossOrigin="anonymous"
          />
        </div>

        {/* Content */}
        <div className="mb-16">
          <h2 className="text-xl font-bold mb-6">
            {isEditable ? (
              <EditableText
                value={picturesTitle}
                onChange={handleSectionTitleChange}
                placeholder="Section Title"
                className="text-xl font-bold"
              />
            ) : (
              picturesTitle
            )}
          </h2>

          <div className="text-center py-16 text-gray-500">
            <p className="text-lg">No pictures have been uploaded for this report.</p>
            {isEditable && <p className="text-sm mt-2">Go to the Pictures tab to upload images.</p>}
          </div>
        </div>

        {/* Footer */}
        <div className="footer-container">
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-04-29%20115454-uWCS2yWrowegSqw9c2SIVcLdedTk82.png"
            alt="GreenLight Footer"
            className="w-full h-auto"
            crossOrigin="anonymous"
          />
        </div>
      </div>
    )
  }

  return isPreview ? (
    // Preview mode - show all images in one scrollable view
    <div className="report-page min-h-[1056px] relative">
      {/* Header with logo */}
      <div className="mb-8">
        <img
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-04-29%20115501-BD1uw5tVq9PtVYW6Z6FKM1i8in6GeV.png"
          alt="GreenLight Logo"
          className="h-24"
          crossOrigin="anonymous"
        />
      </div>

      {/* Content */}
      <div className="mb-16">
        <h2 className="text-xl font-bold mb-6">
          {isEditable ? (
            <EditableText
              value={picturesTitle}
              onChange={handleSectionTitleChange}
              placeholder="Section Title"
              className="text-xl font-bold"
            />
          ) : (
            picturesTitle
          )}
        </h2>

        {/* Images organized by unit */}
        <div className="space-y-8">
          {sortedUnits.map((unit) => (
            <div key={unit} className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Unit {unit}</h3>
              <div className="grid grid-cols-3 gap-6">
                {processedImages[unit].map((image) => (
                  <div key={image.id} className="space-y-2">
                    <div className="relative">
                      <img
                        src={image.url || "/placeholder.svg"}
                        alt={image.caption || image.filename}
                        className="w-full h-48 object-cover rounded border"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = "/placeholder.svg?key=error"
                        }}
                      />
                      {isEditable && (
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2 h-8 w-8 p-0"
                          onClick={() => handleRemoveImage(image.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="space-y-1">
                      {isEditable ? (
                        <>
                          <EditableText
                            value={image.unit}
                            onChange={(value) => handleUnitChange(image.id, value)}
                            placeholder="Unit"
                            className="text-sm font-medium"
                          />
                          <EditableText
                            value={image.caption}
                            onChange={(value) => handleCaptionChange(image.id, value)}
                            placeholder="Image caption"
                            className="text-sm text-gray-600"
                            multiline={true}
                          />
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-medium">Unit {image.unit}</p>
                          <p className="text-sm text-gray-600">{image.caption}</p>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="footer-container">
        <img
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-04-29%20115454-uWCS2yWrowegSqw9c2SIVcLdedTk82.png"
          alt="GreenLight Footer"
          className="w-full h-auto"
          crossOrigin="anonymous"
        />
      </div>
    </div>
  ) : (
    // PDF/Print mode - paginate the images
    <>
      {imagePages.map((pageImages, pageIndex) => (
        <div key={pageIndex} className="report-page min-h-[1056px] relative">
          {/* Header with logo */}
          <div className="mb-8">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-04-29%20115501-BD1uw5tVq9PtVYW6Z6FKM1i8in6GeV.png"
              alt="GreenLight Logo"
              className="h-24"
              crossOrigin="anonymous"
            />
          </div>

          {/* Content */}
          <div className="mb-16">
            {pageIndex === 0 && <h2 className="text-xl font-bold mb-6">{picturesTitle}</h2>}

            {/* Images in 2x3 grid */}
            <div className="grid grid-cols-2 gap-4">
              {pageImages.map((image) => (
                <div key={image.id} className="space-y-2">
                  <img
                    src={image.url || "/placeholder.svg"}
                    alt={image.caption || image.filename}
                    className="w-full h-40 object-cover rounded border"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = "/placeholder.svg?key=error"
                    }}
                  />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Unit {image.unit}</p>
                    <p className="text-sm text-gray-600">{image.caption}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="footer-container">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-04-29%20115454-uWCS2yWrowegSqw9c2SIVcLdedTk82.png"
              alt="GreenLight Footer"
              className="w-full h-auto"
              crossOrigin="anonymous"
            />
          </div>

          {/* Page number */}
          <div className="absolute top-4 right-4 text-sm">
            Page {4 + imagePages.length + pageIndex} of{" "}
            {4 + imagePages.length + Math.ceil(allImages.length / imagesPerPage)}
          </div>
        </div>
      ))}
    </>
  )
}
