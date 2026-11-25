import { CheckCircle2, FileText, Loader2, Upload, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { type DragEvent, useRef, useState } from 'react';

export interface FileUploadProps {
  onFileSelect: (file: File) => void | Promise<void>;
  acceptedTypes?: string;
  maxSizeMB?: number;
  busy?: boolean;
  fileName?: string;
  extractedChars?: number;
  onClear?: () => void;
  label?: string;
  sublabel?: string;
  className?: string;
}

const formatBytes = (bytes: number): string => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / k ** i).toFixed(1)} ${sizes[i]}`;
};

export default function FileUpload({
  onFileSelect,
  acceptedTypes = '.pdf,.docx,.pptx,.txt,.md',
  maxSizeMB = 25,
  busy = false,
  fileName,
  extractedChars,
  onClear,
  label = 'Перетащите файл лекции сюда или нажмите для выбора',
  sublabel = 'PDF · DOCX · PPTX · TXT',
  className = '',
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [selectedSize, setSelectedSize] = useState<number>(0);

  const handleFile = (f: File | undefined) => {
    if (!f) return;
    setSelectedSize(f.size);
    onFileSelect(f);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setOver(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  return (
    <div className={`ku-upload-wrap ${className}`}>
      <motion.div
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.99 }}
        animate={{
          scale: over ? 1.015 : 1,
          borderColor: over ? 'var(--color-azure)' : 'var(--line-strong)',
        }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        className={`ku-upload-zone ${over ? 'over' : ''}`}
        onClick={() => !busy && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={acceptedTypes}
          hidden
          onChange={(e) => {
            handleFile(e.target.files?.[0]);
            e.target.value = '';
          }}
        />

        <motion.div
          animate={{ y: over ? -4 : 0, scale: over ? 1.08 : 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 24 }}
          className="ku-upload-icon-box"
        >
          {busy ? <Loader2 size={24} className="ku-spin" /> : <Upload size={24} />}
        </motion.div>

        <div className="ku-upload-title">{label}</div>
        <div className="ku-upload-sub">
          {sublabel} · до {maxSizeMB} МБ
        </div>

        <div className="ku-upload-formats">
          {['PDF', 'DOCX', 'PPTX', 'TXT'].map((ext) => (
            <span key={ext} className="ku-format-chip">
              {ext}
            </span>
          ))}
        </div>
      </motion.div>

      <AnimatePresence>
        {(fileName || busy) && (
          <motion.div
            initial={{ opacity: 0, y: 10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -6, height: 0 }}
            transition={{ type: 'spring', stiffness: 360, damping: 30 }}
            className="ku-upload-item"
          >
            <div className="ku-upload-item-ic">
              {busy ? <Loader2 size={18} className="ku-spin" /> : <FileText size={18} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="row spread">
                <b className="trunc" style={{ fontSize: 14 }}>
                  {fileName || 'Извлечение текста...'}
                </b>
                {!busy && extractedChars !== undefined && (
                  <span className="badge ok">
                    <CheckCircle2 size={12} /> {extractedChars} симв.
                  </span>
                )}
              </div>
              <div className="muted sm" style={{ fontSize: 12 }}>
                {selectedSize ? formatBytes(selectedSize) : 'Готово к анализу ИИ'}
              </div>
              <div className="ku-upload-prog">
                <motion.div
                  initial={{ width: '15%' }}
                  animate={{ width: busy ? '68%' : '100%' }}
                  transition={{ duration: 0.45 }}
                  className="ku-upload-prog-bar"
                />
              </div>
            </div>
            {!busy && onClear && (
              <button
                type="button"
                className="btn btn-icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                }}
                aria-label="Clear file"
              >
                <X size={15} />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
