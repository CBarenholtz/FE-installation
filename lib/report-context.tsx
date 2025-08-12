"use client"
import { createContext, useContext, useState, type ReactNode } from "react"

interface SectionTitles {
  detailsTitle: string
}

interface ReportContextType {
  sectionTitles: SectionTitles
  setSectionTitles: (titles: SectionTitles | ((prev: SectionTitles) => SectionTitles)) => void
}

const ReportContext = createContext<ReportContextType | undefined>(undefined)

export function ReportProvider({ children }: { children: ReactNode }) {
  const [sectionTitles, setSectionTitles] = useState<SectionTitles>({
    detailsTitle: "Detailed Unit Information",
  })

  return <ReportContext.Provider value={{ sectionTitles, setSectionTitles }}>{children}</ReportContext.Provider>
}

export function useReportContext() {
  const context = useContext(ReportContext)
  if (context === undefined) {
    throw new Error("useReportContext must be used within a ReportProvider")
  }
  return context
}
