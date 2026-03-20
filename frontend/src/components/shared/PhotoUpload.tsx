import { useRef, useState } from "react";
import { Camera, X, Loader2, ImagePlus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface PhotoUploadProps {
  previewUrls: string[];
  onFilesSelected: (files: File[]) => void;
  onRemove: (index: number) => void;
  isUploading?: boolean;
  maxPhotos?: number;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_MB = 5;

export function PhotoUpload({
  previewUrls,
  onFilesSelected,
  onRemove,
  isUploading,
  maxPhotos = 6,
}: PhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    e.target.value = "";
    setError(null);

    const validFiles: File[] = [];
    for (const file of files) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError("Please upload JPEG, PNG, or WebP images.");
        continue;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setError(`Images must be under ${MAX_SIZE_MB}MB.`);
        continue;
      }
      validFiles.push(file);
    }

    if (previewUrls.length + validFiles.length > maxPhotos) {
      setError(`You can only upload up to ${maxPhotos} photos.`);
      return;
    }

    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {previewUrls.map((url, i) => (
          <div
            key={i}
            className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-border bg-muted"
          >
            <img
              src={url}
              alt={`Photo ${i + 1}`}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-sm hover:bg-black/70 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            {i === 0 && (
              <div className="absolute bottom-0 inset-x-0 bg-primary/80 text-[10px] text-white font-bold uppercase py-1 text-center">
                Main
              </div>
            )}
          </div>
        ))}

        {previewUrls.length < maxPhotos && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "aspect-[3/4] rounded-2xl border-2 border-dashed border-border bg-muted/50 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/40 hover:bg-primary/5 transition-all active:scale-95",
              isUploading && "pointer-events-none opacity-50",
            )}
          >
            {isUploading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-background shadow-sm flex items-center justify-center">
                  <Plus className="w-5 h-5 text-primary" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  Add Photo
                </span>
              </>
            )}
          </button>
        )}
      </div>

      {error && (
        <p className="text-xs text-destructive text-center font-medium">
          {error}
        </p>
      )}

      <p className="text-center text-[10px] text-muted-foreground uppercase tracking-widest">
        Up to {maxPhotos} photos
      </p>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={ACCEPTED_TYPES.join(",")}
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
