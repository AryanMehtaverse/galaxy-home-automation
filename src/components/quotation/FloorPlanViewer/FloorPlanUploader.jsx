import React, { useRef } from 'react'
import { Upload, FileImage, X } from 'lucide-react'

export function FloorPlanUploader({ onUpload, onRemove, current }) {
  const inputRef = useRef(null)

  const handleFile = (file) => {
    if (!file) return
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
    if (!allowed.includes(file.type)) {
      alert('Please upload a PDF, JPG, or PNG file.')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      onUpload({
        data: e.target.result,
        mimeType: file.type,
        fileName: file.name,
      })
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  if (current?.data) {
    return (
      <div className="flex items-center justify-between p-4 bg-galaxy-50 border border-galaxy-200 rounded-xl">
        <div className="flex items-center gap-3">
          <FileImage className="w-8 h-8 text-galaxy-600" />
          <div>
            <p className="text-sm font-medium text-galaxy-800">{current.fileName}</p>
            <p className="text-xs text-gray-500">{current.mimeType}</p>
          </div>
        </div>
        <button onClick={onRemove} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onClick={() => inputRef.current?.click()}
      className="border-2 border-dashed border-galaxy-300 rounded-xl p-10 text-center cursor-pointer hover:border-galaxy-500 hover:bg-galaxy-50 transition-all"
    >
      <Upload className="w-10 h-10 text-galaxy-400 mx-auto mb-3" />
      <p className="text-sm font-medium text-gray-700 mb-1">Drop your floor plan here</p>
      <p className="text-xs text-gray-400">PDF, JPG or PNG • Max 10MB</p>
      <button
        type="button"
        className="mt-4 px-4 py-2 bg-galaxy-600 text-white text-sm rounded-lg hover:bg-galaxy-700 transition-colors"
      >
        Browse File
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
      />
    </div>
  )
}
