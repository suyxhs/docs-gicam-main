"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Динамический импорт PDF компонентов
const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
  { ssr: false }
);

const PDFViewer = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFViewer),
  { ssr: false }
);

const ProfessionalPDF = dynamic(
  () => import('./professional-pdf-document').then((mod) => mod.ProfessionalPDF),
  { ssr: false }
);

interface PDFClientProps {
  title: string;
  content: string;
  tags?: string[];
  fileName?: string;
  showPreview?: boolean;
}

export default function PDFClient({ 
  title, 
  content, 
  tags = [],
  fileName,
  showPreview = false,
}: PDFClientProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [showViewer, setShowViewer] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const defaultFileName = fileName || 
    title.toLowerCase()
      .replace(/[^\w\sа-яА-ЯёЁ]/g, '')
      .replace(/\s+/g, '-') + '.pdf';

  if (!isMounted) {
    return (
      <button
        disabled
        className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium bg-gray-200 text-gray-500 cursor-wait"
      >
        <span>PDF</span>
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        {/* PDFDownloadLink */}
        <PDFDownloadLink
          document={<ProfessionalPDF title={title} content={content} tags={tags} />}
          fileName={defaultFileName}
        >
          {({ loading, error }) => {
            if (error) {
              console.error('PDF Error:', error);
              return (
                <button
                  disabled
                  className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium bg-red-100 text-red-600 border border-red-200"
                  title="Ошибка генерации PDF"
                >
                  <span>❌</span>
                </button>
              );
            }

            return (
              <button
                disabled={loading}
                className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  loading 
                    ? 'bg-gray-200 text-gray-500 cursor-wait'
                    : 'hover:bg-primary/10 text-primary border border-primary/20 hover:border-primary/30'
                }`}
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="hidden sm:inline">Генерация...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="hidden sm:inline">PDF</span>
                  </>
                )}
              </button>
            );
          }}
        </PDFDownloadLink>

        {/* Кнопка предпросмотра */}
        {showPreview && (
          <button
            onClick={() => setShowViewer(!showViewer)}
            className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-primary/10 text-primary border border-primary/20 hover:border-primary/30"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="hidden sm:inline">{showViewer ? 'Скрыть' : 'Просмотр'}</span>
          </button>
        )}
      </div>

      {/* PDFViewer для предпросмотра */}
      {showViewer && showPreview && (
        <div className="w-full h-[500px] border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden mt-4">
          <PDFViewer width="100%" height="100%" showToolbar>
            <ProfessionalPDF title={title} content={content} tags={tags} />
          </PDFViewer>
        </div>
      )}
    </div>
  );
}