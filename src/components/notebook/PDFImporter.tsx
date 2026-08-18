'use client';

import { useRef, useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf-worker/pdf.worker.min.mjs';

interface PDFImporterProps {
  onPDFImported: (imageUrl: string, pageCount: number) => void;
}

export default function PDFImporter({ onPDFImported }: PDFImporterProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const page = await pdf.getPage(1);

      const scale = 2;
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Nao foi possivel obter o contexto do canvas');
      }

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await (page.render({
        canvasContext: context,
        viewport,
      } as any)).promise;

      const imageUrl = canvas.toDataURL('image/png');
      onPDFImported(imageUrl, pdf.numPages);
    } catch (err) {
      console.error('Erro ao importar PDF:', err);
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
        title="Importar PDF"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FileText className="w-4 h-4" />
        )}
        <span>{loading ? 'Importando...' : 'PDF'}</span>
      </button>
    </>
  );
}
