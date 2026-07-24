import React, { useState, useRef, useCallback } from "react";
import { Camera, Upload, X, AlertCircle, CheckCircle2 } from "lucide-react";

interface ImageUploadProps {
  currentAvatar: string | null;
  onUpload: (base64: string) => Promise<void>;
  saving?: boolean;
}

const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export const ImageUpload: React.FC<ImageUploadProps> = ({
  currentAvatar,
  onUpload,
  saving = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return "Please select a JPEG, PNG, GIF, or WebP image.";
    }
    if (file.size > MAX_SIZE) {
      return "File size must be under 2MB.";
    }
    return null;
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setSuccess(false);

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    const base64 = await fileToBase64(file);
    setPreview(base64);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleConfirmUpload = async () => {
    if (!preview) return;
    setIsUploading(true);
    setError(null);
    try {
      await onUpload(preview);
      setSuccess(true);
      setPreview(null);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message ?? "Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancelPreview = () => {
    setPreview(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-3">
      {/* Current Avatar or Preview */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-emerald-100 shadow-sm bg-gray-50 flex items-center justify-center">
            {preview ? (
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            ) : currentAvatar ? (
              <img
                src={currentAvatar}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <Camera className="w-7 h-7 text-gray-300" />
            )}
          </div>

          {/* Upload progress overlay */}
          {isUploading && (
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
              <div className="w-6 h-6 rounded-full border-2 border-white border-t-transparent animate-spin" />
            </div>
          )}
        </div>

        <div className="flex-1">
          <p className="text-xs font-semibold text-gray-700">Profile Photo</p>
          <p className="text-[10px] text-gray-400">
            JPEG, PNG, GIF, WebP. Max 2MB.
          </p>

          {success && (
            <div className="mt-1.5 flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Photo updated successfully!
            </div>
          )}
        </div>
      </div>

      {/* Dropzone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-200 ${
          isDragOver
            ? "border-emerald-400 bg-emerald-50/50"
            : "border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/30"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleInputChange}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-1.5 pointer-events-none">
          <div
            className={`p-2 rounded-full transition-colors ${
              isDragOver ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-400"
            }`}
          >
            <Upload className="w-4 h-4" />
          </div>
          <p className="text-xs text-gray-500 font-medium">
            {isDragOver ? "Drop image here" : "Drag & drop or click to browse"}
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-1.5 text-[11px] text-red-600 bg-red-50 px-3 py-2 rounded-lg">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Action Buttons (show when preview exists) */}
      {preview && (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={handleCancelPreview}
            disabled={isUploading}
            className="px-3 py-1.5 text-[11px] font-semibold text-gray-500 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-3.5 h-3.5 inline mr-1" />
            Cancel
          </button>
          <button
            onClick={handleConfirmUpload}
            disabled={isUploading || saving}
            className="px-4 py-1.5 text-[11px] font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
          >
            {isUploading ? (
              <>
                <div className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5" />
                Upload Photo
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};