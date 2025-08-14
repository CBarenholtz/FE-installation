"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, Link, X, ImageIcon, Wand2 } from "lucide-react"
import type { ImageData, InstallationData, Note } from "@/lib/types"
import { extractUnitFromFilename, setCaptionsFromAIAnalysis } from "@/lib/utils/image-processor"
import JSZip from "jszip"

interface ImageUploadProps {
  onImagesUploaded: (images: ImageData[]) => void
  existingImages?: ImageData[]
  installationData?: InstallationData[]
  notes?: Note[]
}

export default function ImageUpload({
  onImagesUploaded,
  existingImages = [],
  installationData = [],
  notes = [],
}: ImageUploadProps) {
  const [images, setImages] = useState<ImageData[]>(existingImages)
  const [googleDriveLinks, setGoogleDriveLinks] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle zip file upload and extract images with improved unit detection
  const handleZipUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !file.name.endsWith(".zip")) {
      alert("Please select a valid ZIP file")
      return
    }

    setIsProcessing(true)
    try {
      const zip = new JSZip()
      const zipContent = await zip.loadAsync(file)
      const newImages: ImageData[] = []

      for (const [filename, zipEntry] of Object.entries(zipContent.files)) {
        if (!zipEntry.dir && /\.(jpg|jpeg|png|gif|webp)$/i.test(filename)) {
          const imageBlob = await zipEntry.async("blob")
          const imageFile = new File([imageBlob], filename, { type: imageBlob.type })
          const imageUrl = URL.createObjectURL(imageFile)

          // Use improved unit extraction
          const unit = extractUnitFromFilename(filename)

          newImages.push({
            id: `zip_${Date.now()}_${Math.random()}`,
            file: imageFile,
            url: imageUrl,
            caption: "",
            unit: unit,
            filename: filename,
          })
        }
      }

      const updatedImages = [...images, ...newImages]
      setImages(updatedImages)
      onImagesUploaded(updatedImages)
    } catch (error) {
      console.error("Error processing ZIP file:", error)
      alert("Error processing ZIP file. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleGoogleDriveLinks = () => {
    const links = googleDriveLinks.split("\n").filter((link) => link.trim())
    const newImages: ImageData[] = []

    links.forEach((link) => {
      const trimmedLink = link.trim()
      if (trimmedLink) {
        let fileId = ""
        let filename = "google_drive_image"

        if (trimmedLink.includes("drive.google.com")) {
          const idMatch = trimmedLink.match(/\/d\/([a-zA-Z0-9-_]+)/)
          if (idMatch) {
            fileId = idMatch[1]
            filename = `gdrive_${fileId}`
          }
        } else if (trimmedLink.match(/^[a-zA-Z0-9-_]+$/)) {
          fileId = trimmedLink
          filename = `gdrive_${fileId}`
        }

        if (fileId) {
          const imageUrl = `https://drive.google.com/uc?id=${fileId}`
          newImages.push({
            id: `gdrive_${Date.now()}_${Math.random()}`,
            file: null,
            url: imageUrl,
            caption: "",
            unit: "",
            filename: filename,
            googleDriveId: fileId,
          })
        }
      }
    })

    const updatedImages = [...images, ...newImages]
    setImages(updatedImages)
    onImagesUploaded(updatedImages)
    setGoogleDriveLinks("")
  }

  const handleAutoSuggestCaptions = async () => {
    console.log("🤖 Auto-suggest captions with AI analysis clicked")
    console.log("Images:", images.length)
    console.log("Installation data:", installationData.length)
    console.log("Notes:", notes.length)

    if (images.length === 0) {
      alert("No images to analyze")
      return
    }

    if (installationData.length === 0) {
      alert("No installation data available for caption generation")
      return
    }

    if (!process.env.GROQ_API_KEY) {
      alert("AI analysis requires Groq API configuration. Please check your environment settings.")
      return
    }

    setIsProcessing(true)

    try {
      // Use AI-powered caption analysis with direct API calls
      console.log("🤖 Starting AI-powered caption analysis...")
      const captionedImages = await setCaptionsFromAIAnalysis(images, installationData, notes)

      console.log("🤖 AI caption analysis complete!")

      // Log changes made
      const changedImages = captionedImages.filter((img, index) => img.caption !== images[index].caption)
      console.log("Images with AI-generated captions:", changedImages.length)
      changedImages.forEach((img) => {
        console.log(`Unit ${img.unit}: "${img.caption}"`)
      })

      setImages(captionedImages)
      onImagesUploaded(captionedImages)

      if (changedImages.length > 0) {
        alert(`AI analysis complete! Generated captions for ${changedImages.length} images.`)
      } else {
        alert("AI analysis complete! No new captions were generated.")
      }
    } catch (error) {
      console.error("🤖 Error in AI caption analysis:", error)
      alert("Error analyzing images with AI. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const updateImage = (id: string, updates: Partial<ImageData>) => {
    const updatedImages = images.map((img) => (img.id === id ? { ...img, ...updates } : img))
    setImages(updatedImages)
    onImagesUploaded(updatedImages)
  }

  const removeImage = (id: string) => {
    const updatedImages = images.filter((img) => img.id !== id)
    setImages(updatedImages)
    onImagesUploaded(updatedImages)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Upload Pictures for Report
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="zip" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="zip">ZIP File Upload</TabsTrigger>
            <TabsTrigger value="googledrive">Google Drive Links</TabsTrigger>
          </TabsList>

          <TabsContent value="zip" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="zip-upload">Upload ZIP file containing images</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="zip-upload"
                  type="file"
                  accept=".zip"
                  ref={fileInputRef}
                  onChange={handleZipUpload}
                  disabled={isProcessing}
                />
                <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isProcessing}>
                  <Upload className="h-4 w-4 mr-2" />
                  {isProcessing ? "Processing..." : "Browse"}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Name your images with unit numbers (e.g., "A01_leak.jpg") for automatic unit matching
              </p>
            </div>
          </TabsContent>

          <TabsContent value="googledrive" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gdrive-links">Google Drive Links or File IDs</Label>
              <textarea
                id="gdrive-links"
                className="w-full h-32 p-2 border rounded-md resize-none"
                placeholder="Paste Google Drive links or file IDs (one per line)&#10;https://drive.google.com/file/d/1ABC123.../view&#10;or just: 1ABC123..."
                value={googleDriveLinks}
                onChange={(e) => setGoogleDriveLinks(e.target.value)}
              />
              <Button onClick={handleGoogleDriveLinks} disabled={!googleDriveLinks.trim()}>
                <Link className="h-4 w-4 mr-2" />
                Add Images
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Display uploaded images with editing capabilities and auto-suggest */}
        {images.length > 0 && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Uploaded Images ({images.length})</h3>
              {installationData.length > 0 && (
                <Button variant="outline" size="sm" onClick={handleAutoSuggestCaptions} disabled={isProcessing}>
                  <Wand2 className="h-4 w-4 mr-2" />
                  {isProcessing ? "Analyzing..." : "AI Auto-Suggest Captions"}
                </Button>
              )}
            </div>
            <div className="grid gap-4">
              {images.map((image) => (
                <Card key={image.id} className="p-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <img
                        src={image.url || "/placeholder.svg"}
                        alt={image.filename}
                        className="w-24 h-24 object-cover rounded border"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = "/placeholder.svg?key=pdmsa"
                        }}
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{image.filename}</span>
                        <Button variant="ghost" size="sm" onClick={() => removeImage(image.id)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor={`unit-${image.id}`} className="text-xs">
                            Unit
                          </Label>
                          <Input
                            id={`unit-${image.id}`}
                            value={image.unit}
                            onChange={(e) => updateImage(image.id, { unit: e.target.value.toUpperCase() })}
                            placeholder="e.g., A01"
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`caption-${image.id}`} className="text-xs">
                            Caption
                          </Label>
                          <Input
                            id={`caption-${image.id}`}
                            value={image.caption}
                            onChange={(e) => updateImage(image.id, { caption: e.target.value })}
                            placeholder="Image description"
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
