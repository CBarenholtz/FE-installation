"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { CustomerInfo, Note } from "@/lib/types"

// Add coverImage to the ReportContextType interface
interface ReportContextType {
  customerInfo: CustomerInfo
  setCustomerInfo: React.Dispatch<React.SetStateAction<CustomerInfo>>
  toiletCount: number
  setToiletCount: React.Dispatch<React.SetStateAction<number>>
  notes: Note[]
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>
  letterText: string[]
  setLetterText: React.Dispatch<React.SetStateAction<string[]>>
  reportTitle: string
  setReportTitle: React.Dispatch<React.SetStateAction<string>>
  signatureName: string
  setSignatureName: React.Dispatch<React.SetStateAction<string>>
  signatureTitle: string
  setSignatureTitle: React.Dispatch<React.SetStateAction<string>>
  // Remove these lines:
  // hasUnsavedChanges: boolean
  // setHasUnsavedChanges: React.Dispatch<React.SetStateAction<boolean>>
  // saveChanges: () => void
  // Add new editable text elements
  rePrefix: string
  setRePrefix: React.Dispatch<React.SetStateAction<string>>
  dearPrefix: string
  setDearPrefix: React.Dispatch<React.SetStateAction<string>>
  sectionTitles: Record<string, string>
  setSectionTitles: React.Dispatch<React.SetStateAction<Record<string, string>>>
  // Add cover image
  coverImage: string | null
  setCoverImage: React.Dispatch<React.SetStateAction<string | null>>
  coverImageSize: number
  setCoverImageSize: React.Dispatch<React.SetStateAction<number>>
}

const defaultCustomerInfo: CustomerInfo = {
  customerName: "",
  propertyName: "",
  address: "",
  city: "",
  state: "",
  zip: "",
  date: new Date().toLocaleDateString(),
}

const defaultLetterText = [
  "Please find the attached Installation Report. As you can see, we clearly indicated the installed items in each area. You will see the repairs that we made noted as well.",
  "We successfully installed {toiletCount} toilets at the property.",
  "Please send us copies of the actual water bills following our installation, so we can analyze them to pinpoint the anticipated water reduction and savings. We urge you to fix any constant water issues ASAP, as not to compromise potential savings as a result of our installation.",
  "Thank you for choosing Green Light Water Conservation. We look forward to working with you in the near future.",
]

const defaultSectionTitles = {
  notes: "Notes",
  detailsTitle: "Detailed Unit Information",
  pictures: "Installation Pictures",
}

const ReportContext = createContext<ReportContextType | undefined>(undefined)

// Add coverImage state to the ReportProvider
export function ReportProvider({ children }: { children: ReactNode }) {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>(defaultCustomerInfo)
  const [toiletCount, setToiletCount] = useState<number>(0)
  const [notes, setNotes] = useState<Note[]>([])
  const [letterText, setLetterText] = useState<string[]>(defaultLetterText)
  const [reportTitle, setReportTitle] = useState<string>("Water Conservation Installation Report")
  const [signatureName, setSignatureName] = useState<string>("Zev Stern, CWEP")
  const [signatureTitle, setSignatureTitle] = useState<string>("Chief Operating Officer")
  // Remove this line:
  // const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false)

  // Add new state for editable text elements
  const [rePrefix, setRePrefix] = useState<string>("RE:")
  const [dearPrefix, setDearPrefix] = useState<string>("Dear")
  const [sectionTitles, setSectionTitles] = useState<Record<string, string>>(defaultSectionTitles)

  // Add cover image state
  const [coverImage, setCoverImage] = useState<string | null>(null)
  const [coverImageSize, setCoverImageSize] = useState<number>(80)

  // Load data from localStorage on initial render
  useEffect(() => {
    const storedCustomerInfo = localStorage.getItem("customerInfo")
    const storedToiletCount = localStorage.getItem("toiletCount")
    const storedNotes = localStorage.getItem("reportNotes")
    const storedLetterText = localStorage.getItem("letterText")
    const storedReportTitle = localStorage.getItem("reportTitle")
    const storedSignatureName = localStorage.getItem("signatureName")
    const storedSignatureTitle = localStorage.getItem("signatureTitle")
    // Load new editable text elements
    const storedRePrefix = localStorage.getItem("rePrefix")
    const storedDearPrefix = localStorage.getItem("dearPrefix")
    const storedSectionTitles = localStorage.getItem("sectionTitles")
    // Load cover image
    const storedCoverImage = localStorage.getItem("coverImage")
    const storedCoverImageSize = localStorage.getItem("coverImageSize")

    if (storedCustomerInfo) {
      try {
        setCustomerInfo(JSON.parse(storedCustomerInfo))
      } catch (e) {
        console.error('Failed to parse storedCustomerInfo:', e)
      }
    }

    if (storedToiletCount) {
      try {
        setToiletCount(JSON.parse(storedToiletCount))
      } catch (e) {
        console.error('Failed to parse storedToiletCount:', e)
      }
    }

    if (storedNotes) {
      try {
        setNotes(JSON.parse(storedNotes))
      } catch (e) {
        console.error('Failed to parse storedNotes:', e)
      }
    }

    if (storedLetterText) {
      try {
        setLetterText(JSON.parse(storedLetterText))
      } catch (e) {
        console.error('Failed to parse storedLetterText:', e)
      }
    } else {
      // Initialize with default text that includes the toilet count
      setLetterText(defaultLetterText)
    }

    if (storedReportTitle) {
      try {
        setReportTitle(JSON.parse(storedReportTitle))
      } catch (e) {
        console.error('Failed to parse storedReportTitle:', e)
      }
    }

    if (storedSignatureName) {
      try {
        setSignatureName(JSON.parse(storedSignatureName))
      } catch (e) {
        console.error('Failed to parse storedSignatureName:', e)
      }
    }

    if (storedSignatureTitle) {
      try {
        setSignatureTitle(JSON.parse(storedSignatureTitle))
      } catch (e) {
        console.error('Failed to parse storedSignatureTitle:', e)
      }
    }

    // Load new editable text elements
    if (storedRePrefix) {
      try {
        setRePrefix(JSON.parse(storedRePrefix))
      } catch (e) {
        console.error('Failed to parse storedRePrefix:', e)
      }
    }

    if (storedDearPrefix) {
      try {
        setDearPrefix(JSON.parse(storedDearPrefix))
      } catch (e) {
        console.error('Failed to parse storedDearPrefix:', e)
      }
    }

    if (storedSectionTitles) {
      try {
        setSectionTitles(JSON.parse(storedSectionTitles))
      } catch (e) {
        console.error('Failed to parse storedSectionTitles:', e)
      }
    }

    // Load cover image
    if (storedCoverImage) {
      try {
        setCoverImage(JSON.parse(storedCoverImage))
      } catch (e) {
        // If not valid JSON, assume it's a data URL string
        setCoverImage(storedCoverImage)
        console.warn('Stored cover image is not JSON, using as string.')
      }
    }

    if (storedCoverImageSize) {
      try {
        setCoverImageSize(JSON.parse(storedCoverImageSize))
      } catch (e) {
        console.error('Failed to parse storedCoverImageSize:', e)
      }
    }
  }, [])

  // Remove the saveChanges function entirely

  return (
    <ReportContext.Provider
      value={{
        customerInfo,
        setCustomerInfo,
        toiletCount,
        setToiletCount,
        notes,
        setNotes,
        letterText,
        setLetterText,
        reportTitle,
        setReportTitle,
        signatureName,
        setSignatureName,
        signatureTitle,
        setSignatureTitle,
        // Remove these lines:
        // hasUnsavedChanges,
        // setHasUnsavedChanges,
        // saveChanges,
        // Add new editable text elements to context
        rePrefix,
        setRePrefix,
        dearPrefix,
        setDearPrefix,
        sectionTitles,
        setSectionTitles,
        // Add cover image to context
        coverImage,
        setCoverImage,
        coverImageSize,
        setCoverImageSize,
      }}
    >
      {children}
    </ReportContext.Provider>
  )
}

// Original hook that throws an error if used outside of a ReportProvider
export function useReportContext() {
  const context = useContext(ReportContext)
  if (context === undefined) {
    throw new Error("useReportContext must be used within a ReportProvider")
  }
  return context
}

// New safe hook that returns null if used outside of a ReportProvider
export function useSafeReportContext() {
  return useContext(ReportContext)
}
