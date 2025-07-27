"use client";

import React, { useRef, useState } from "react";
import { FaCamera, FaSpinner } from "react-icons/fa";

interface ProfilePictureUploadProps {
  currentImage?: string;
  userName: string;
  onImageChange: (imageUrl: string) => void;
  isEditing?: boolean;
  className?: string;
}

export default function ProfilePictureUpload({
  currentImage,
  userName,
  onImageChange,
  isEditing = false,
  className = ""
}: ProfilePictureUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleImageClick = () => {
    if (isEditing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/upload/profile-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json() as { error?: string };
        throw new Error(errorData.error ?? "Failed to upload image");
      }

      const data = await response.json() as { imageUrl: string };
      onImageChange(data.imageUrl);
      
    } catch (error) {
      console.error("Error uploading image:", error);
      setUploadError(error instanceof Error ? error.message : "Failed to upload image");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const placeholderUrl = `https://via.placeholder.com/160x200/6d28d9/ffffff?text=${userName.charAt(0)}`;

  return (
    <div className={`relative ${className}`}>
      <div
        className={`relative group ${isEditing ? "cursor-pointer" : ""}`}
        onClick={handleImageClick}
      >
        <img
          src={currentImage ?? placeholderUrl}
          alt={userName}
          className="w-32 h-40 mx-auto rounded-lg border border-gray-600/40 object-cover"
          onError={(e) => {
            e.currentTarget.src = placeholderUrl;
          }}
        />
        
        {isEditing && (
          <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
            {isUploading ? (
              <FaSpinner className="w-6 h-6 text-white animate-spin" />
            ) : (
              <div className="text-center">
                <FaCamera className="w-6 h-6 text-white mx-auto mb-1" />
                <span className="text-white text-xs">Change Photo</span>
              </div>
            )}
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
        disabled={isUploading}
      />

      {uploadError && (
        <div className="mt-2 text-red-400 text-xs text-center">
          {uploadError}
        </div>
      )}

      {isEditing && !isUploading && (
        <div className="mt-2 text-center">
          <p className="text-gray-400 text-xs">
            Click to upload a new photo
          </p>
          <p className="text-gray-500 text-xs">
            Max 5MB • JPEG, PNG, WebP
          </p>
        </div>
      )}
    </div>
  );
}