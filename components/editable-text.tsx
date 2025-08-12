"use client"
import { useState } from "react"

interface EditableTextProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  multiline?: boolean
}

export default function EditableText({
  value,
  onChange,
  placeholder = "",
  className = "",
  multiline = false,
}: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)

  const handleSave = () => {
    onChange(editValue)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditValue(value)
    setIsEditing(false)
  }

  if (isEditing) {
    return multiline ? (
      <textarea
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSave()
          }
          if (e.key === "Escape") {
            handleCancel()
          }
        }}
        className={`border rounded px-2 py-1 ${className}`}
        placeholder={placeholder}
        autoFocus
        rows={3}
      />
    ) : (
      <input
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleSave()
          }
          if (e.key === "Escape") {
            handleCancel()
          }
        }}
        className={`border rounded px-2 py-1 ${className}`}
        placeholder={placeholder}
        autoFocus
      />
    )
  }

  return (
    <span onClick={() => setIsEditing(true)} className={`cursor-pointer hover:bg-gray-100 px-1 rounded ${className}`}>
      {value || placeholder}
    </span>
  )
}
