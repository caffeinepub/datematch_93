import { useCallback, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_MB = 5;

export function usePhotoUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadPhotos = useCallback(
    async (files: File[]): Promise<ExternalBlob[]> => {
      if (files.length === 0) return [];

      const valid = files.filter((f) => {
        if (!ACCEPTED_TYPES.includes(f.type)) {
          toast.error(`${f.name}: unsupported format. Use JPEG, PNG, or WebP.`);
          return false;
        }
        if (f.size > MAX_SIZE_MB * 1024 * 1024) {
          toast.error(`${f.name} exceeds ${MAX_SIZE_MB}MB.`);
          return false;
        }
        return true;
      });

      if (valid.length === 0) return [];

      setIsUploading(true);
      setUploadProgress(0);

      const label = valid.length === 1 ? "photo" : `${valid.length} photos`;
      const toastId = toast.loading(`Uploading ${label}...`);

      try {
        const totalBytes = valid.reduce((acc, f) => acc + f.size, 0);
        let completedBytes = 0;

        const blobs: ExternalBlob[] = [];
        for (const file of valid) {
          const buf = await file.arrayBuffer();
          const bytes = new Uint8Array(buf);
          const fileSize = file.size;
          const capturedCompleted = completedBytes;

          const blob = ExternalBlob.fromBytes(bytes).withUploadProgress(
            (pct) => {
              const overall =
                ((capturedCompleted + (pct / 100) * fileSize) / totalBytes) *
                100;
              setUploadProgress(Math.round(overall));
              toast.loading(`Uploading ${label}... ${Math.round(overall)}%`, {
                id: toastId,
              });
            },
          );
          blobs.push(blob);
          completedBytes += fileSize;
        }

        toast.success(
          `${valid.length === 1 ? "Photo" : `${valid.length} photos`} uploaded`,
          { id: toastId },
        );
        return blobs;
      } catch (err) {
        console.error("Photo upload error:", err);
        toast.error("Failed to upload photos", { id: toastId });
        throw err;
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    [],
  );

  return { uploadPhotos, isUploading, uploadProgress };
}
