"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Создаем клиентский компонент для PDF
const PDFClient = dynamic(
  () => import('./pdf-client').catch(err => {
    console.error('Ошибка загрузки PDF клиента:', err);
    return () => <div>Ошибка загрузки PDF генератора</div>;
  }),
  { 
    ssr: false,
    loading: () => (
      <button
        disabled
        className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium bg-gray-200 text-gray-500 cursor-not-allowed"
      >
        <span>Загрузка PDF...</span>
      </button>
    )
  }
);

interface PDFDownloadButtonProps {
  title: string;
  content: string;
  tags?: string[];
  fileName?: string;
  showPreview?: boolean;
}

export const PDFDownloadButton: React.FC<PDFDownloadButtonProps> = (props) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <button
        disabled
        className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium bg-gray-200 text-gray-500 cursor-not-allowed"
      >
        <span>PDF</span>
      </button>
    );
  }

  return <PDFClient {...props} />;
};