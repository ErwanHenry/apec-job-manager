import { useRef, useState } from 'react';

interface FileUploadProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
  accept?: string;
  multiple?: boolean;
}

export default function FileUpload({
  onFileSelected,
  disabled = false,
  accept = '.csv',
  multiple = false,
}: FileUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragActive(true);
    }
  };

  const handleDragOut = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      onFileSelected(files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelected(e.target.files[0]);
    }
  };

  return (
    <div
      onDragOver={handleDrag}
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
        isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 bg-gray-50'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary-400'}`}
      onClick={() => !disabled && fileInput.current?.click()}
    >
      <input
        ref={fileInput}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        disabled={disabled}
        className="hidden"
      />

      <div className="flex flex-col items-center gap-2">
        <span className="text-4xl">📤</span>
        <p className="text-sm font-medium text-gray-900">
          Déposez votre fichier CSV ici ou cliquez pour le sélectionner
        </p>
        <p className="text-xs text-gray-500">Formats acceptés: CSV (max 10MB)</p>
      </div>
    </div>
  );
}
