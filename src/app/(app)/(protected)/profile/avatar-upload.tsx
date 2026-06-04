"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type AvatarUploadProps = {
  initialAvatarUrl?: string | null;
  avatarInitial: string;
  displayName: string;
};

type Step = "upload" | "crop";

export default function AvatarUpload({
  initialAvatarUrl,
  avatarInitial,
  displayName,
}: AvatarUploadProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalFileInputRef = useRef<HTMLInputElement>(null);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl ?? null);
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<Step>("upload");
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Crop Interactive States
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeModal();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const openModal = () => {
    setIsOpen(true);
    setStep("upload");
    setImageSrc(null);
    setErrorMsg("");
  };

  const closeModal = () => {
    if (isUploading) return;
    setIsOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = (file: File) => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Vui lòng chọn một file ảnh hợp lệ.");
      return;
    }

    // Validate size (limit natural size for client processing to 10MB to be safe, actual output is constrained)
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg("Kích thước file ảnh quá lớn (tối đa 10MB).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      const img = new Image();
      img.src = src;
      img.onload = () => {
        const isLandscape = img.naturalWidth > img.naturalHeight;
        let w = 256;
        let h = 256;
        if (isLandscape) {
          w = 256 * (img.naturalWidth / img.naturalHeight);
        } else {
          h = 256 * (img.naturalHeight / img.naturalWidth);
        }
        setImageDimensions({ width: w, height: h });
        setPosition({
          x: (256 - w) / 2,
          y: (256 - h) / 2,
        });
        setScale(1);
        setImageSrc(src);
        setStep("crop");
        setErrorMsg("");
      };
    };
    reader.readAsDataURL(file);
  };

  // Drag Handlers for Viewport Container
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch Handlers for Viewport Container (Mobile support)
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    setIsDragging(true);
    setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    if (!touch) return;
    setPosition({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleScaleChange = (newScale: number) => {
    // Zoom centered on the viewport center (128, 128)
    const ratio = newScale / scale;
    setPosition((prev) => ({
      x: 128 - (128 - prev.x) * ratio,
      y: 128 - (128 - prev.y) * ratio,
    }));
    setScale(newScale);
  };

  // Perform Crop on Canvas and Save to DB
  const handleConfirmCrop = async () => {
    if (!imageSrc) return;
    setIsUploading(true);
    setErrorMsg("");

    try {
      const img = new Image();
      img.src = imageSrc;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Không thể khởi tạo bộ xử lý ảnh.");
      }

      ctx.clearRect(0, 0, 256, 256);

      // Draw image onto canvas according to current scale and positions
      ctx.drawImage(
        img,
        position.x,
        position.y,
        imageDimensions.width * scale,
        imageDimensions.height * scale
      );

      // Convert to compressed jpeg format (quality: 0.85) to keep DB storage footprint extremely small (~15-30KB)
      const croppedBase64 = canvas.toDataURL("image/jpeg", 0.85);

      const res = await fetch("/api/user/avatar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: croppedBase64 }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Tải lên thất bại");
      }

      setAvatarUrl(croppedBase64);
      setIsOpen(false);
      router.refresh();
    } catch (err: any) {
      console.error("Error cropping/uploading avatar:", err);
      setErrorMsg(err.message || "Đã xảy ra lỗi khi lưu ảnh.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm("Bạn có chắc muốn xóa ảnh đại diện này?")) {
      return;
    }

    setIsUploading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/user/avatar", {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Xóa thất bại");
      }

      setAvatarUrl(null);
      router.refresh();
    } catch (err: any) {
      console.error("Error deleting avatar:", err);
      setErrorMsg(err.message || "Đã xảy ra lỗi khi xóa ảnh.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="group relative h-28 w-28 shrink-0 overflow-hidden border border-[var(--color-primary)] bg-[var(--color-surface-container-low)]">
        {/* Avatar Display */}
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-[family-name:var(--font-headline)] text-4xl font-bold text-[var(--color-primary)]">
            {avatarInitial}
          </div>
        )}

        {/* Hover Overlay */}
        <div
          onClick={openModal}
          className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/65 text-white opacity-0 transition-opacity duration-200 cursor-pointer group-hover:opacity-100"
        >
          <span className="material-symbols-outlined text-xl">photo_camera</span>
          <span className="font-[family-name:var(--font-label)] text-[10px] font-semibold uppercase tracking-[0.1em]">
            Thay đổi
          </span>
        </div>

        {/* Delete button (Visible on hover if avatar exists) */}
        {avatarUrl && !isUploading && (
          <button
            type="button"
            onClick={handleDelete}
            title="Xóa ảnh đại diện"
            className="absolute right-1 top-1 z-10 flex h-6 w-6 items-center justify-center bg-black/60 text-white opacity-0 transition-opacity duration-200 hover:bg-red-600 group-hover:opacity-100"
          >
            <span className="material-symbols-outlined text-sm">delete</span>
          </button>
        )}
      </div>

      {/* Popup Modal (Topup Screen UI) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="relative bg-[var(--color-surface-container-lowest)] border-2 border-[var(--color-primary)] p-6 max-w-md w-full flex flex-col gap-6 shadow-2xl animate-[zoomIn_0.2s_ease-out]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--color-outline-variant)] pb-3">
              <h2 className="font-[family-name:var(--font-headline)] text-xl font-bold text-[var(--color-primary)]">
                {step === "upload" ? "Tải ảnh đại diện mới" : "Cắt ảnh đại diện"}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                disabled={isUploading}
                className="text-[var(--color-secondary)] hover:text-[var(--color-primary)] transition-none disabled:opacity-30"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-xs">
                {errorMsg}
              </div>
            )}

            {/* Content Switch */}
            {step === "upload" ? (
              /* Phase 1: Upload Select Area */
              <div
                onClick={() => modalFileInputRef.current?.click()}
                className="border-2 border-dashed border-[var(--color-outline)] hover:border-[var(--color-primary)] transition-colors p-10 flex flex-col items-center justify-center gap-3 cursor-pointer bg-[var(--color-surface-container-low)] text-center group/drop"
              >
                <span className="material-symbols-outlined text-4xl text-[var(--color-secondary)] group-hover/drop:text-[var(--color-primary)] transition-colors">
                  cloud_upload
                </span>
                <p className="font-[family-name:var(--font-label)] text-xs font-semibold uppercase tracking-wider text-[var(--color-primary)]">
                  Nhấp để tải ảnh lên
                </p>
                <p className="text-[10px] text-[var(--color-secondary)]">
                  Hỗ trợ PNG, JPG, WEBP tối đa 10MB
                </p>
                <input
                  type="file"
                  ref={modalFileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            ) : (
              /* Phase 2: Interactive Crop Area */
              <div className="flex flex-col gap-6">
                <p className="text-center text-xs text-[var(--color-secondary)] font-medium">
                  Kéo để di chuyển ảnh, sử dụng thanh trượt bên dưới để thu phóng
                </p>

                {/* Viewport Box */}
                <div
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  className="relative w-64 h-64 overflow-hidden bg-neutral-950 border-2 border-[var(--color-primary)] mx-auto cursor-grab active:cursor-grabbing select-none"
                >
                  {imageSrc && (
                    <img
                      src={imageSrc}
                      alt="Crop preview"
                      style={{
                        position: "absolute",
                        left: `${position.x}px`,
                        top: `${position.y}px`,
                        width: `${imageDimensions.width * scale}px`,
                        height: `${imageDimensions.height * scale}px`,
                        maxWidth: "none",
                        userSelect: "none",
                        pointerEvents: "none",
                      }}
                    />
                  )}
                  {/* Visual Circle/Square Guide Mask */}
                  <div className="absolute inset-0 pointer-events-none border border-white/30" />
                </div>

                {/* Scale Slider Control */}
                <div className="flex items-center gap-3 max-w-[280px] mx-auto w-full">
                  <span className="material-symbols-outlined text-base text-[var(--color-secondary)]">
                    zoom_out
                  </span>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.01"
                    value={scale}
                    onChange={(e) => handleScaleChange(parseFloat(e.target.value))}
                    className="flex-grow accent-[var(--color-primary)] cursor-pointer h-1 bg-[var(--color-outline-variant)] rounded-lg appearance-none"
                  />
                  <span className="material-symbols-outlined text-base text-[var(--color-secondary)]">
                    zoom_in
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4 mt-2">
                  <button
                    type="button"
                    onClick={() => setStep("upload")}
                    disabled={isUploading}
                    className="flex-1 py-3 border border-[var(--color-primary)] text-[var(--color-primary)] font-[family-name:var(--font-label)] text-xs font-semibold uppercase tracking-wider transition-none hover:bg-[var(--color-surface-container)] disabled:opacity-50"
                  >
                    Chọn ảnh khác
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmCrop}
                    disabled={isUploading}
                    className="flex-1 py-3 bg-[var(--color-primary)] text-[var(--color-on-primary)] font-[family-name:var(--font-label)] text-xs font-semibold uppercase tracking-wider transition-none hover:bg-[var(--color-primary-container)] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isUploading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-on-primary)] border-t-transparent" />
                        Đang lưu...
                      </>
                    ) : (
                      "Xác nhận & Lưu"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
