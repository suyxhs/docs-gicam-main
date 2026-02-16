"use client";

import { useState, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface ActionButtonsProps {
  title: string;
}

export function ActionButtons({ title }: ActionButtonsProps) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Функция для печати
  const handlePrint = () => {
    setIsPrinting(true);
    // Добавляем класс для оптимизации печати
    document.body.classList.add('printing');
    
    // Небольшая задержка для применения стилей
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
      document.body.classList.remove('printing');
    }, 100);
  };

  // Функция для генерации PDF
  const generatePDF = async () => {
    setIsGeneratingPDF(true);
    
    try {
      // Находим основной контент
      const contentElement = document.querySelector('.fumadocs-content, article, main') as HTMLElement;
      
      if (!contentElement) {
        throw new Error('Не найден контент для генерации PDF');
      }

      // Создаем временный контейнер для обработки контента
      const tempContainer = document.createElement('div');
      tempContainer.style.width = '1200px';
      tempContainer.style.padding = '40px';
      tempContainer.style.background = '#ffffff';
      tempContainer.style.color = '#000000';
      tempContainer.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
      
      // Клонируем контент
      const clonedContent = contentElement.cloneNode(true) as HTMLElement;
      
      // Очищаем от интерактивных элементов
      const buttons = clonedContent.querySelectorAll('button, .print\\:hidden');
      buttons.forEach(btn => btn.remove());
      
      // Добавляем заголовок
      const header = document.createElement('h1');
      header.textContent = title;
      header.style.fontSize = '32px';
      header.style.marginBottom = '20px';
      header.style.color = '#000000';
      
      tempContainer.appendChild(header);
      tempContainer.appendChild(clonedContent);
      
      // Временно добавляем в DOM
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      document.body.appendChild(tempContainer);

      // Конвертируем в canvas
      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 1200,
        allowTaint: false,
        useCORS: true,
        onclone: (clonedDoc) => {
          // Добавляем стили для клонированного документа
          const style = clonedDoc.createElement('style');
          style.innerHTML = `
            * {
              color: #000000 !important;
              background: transparent !important;
            }
            pre, code {
              background: #f5f5f5 !important;
              border: 1px solid #dddddd !important;
              padding: 10px !important;
              border-radius: 5px !important;
            }
            a {
              color: #0066cc !important;
              text-decoration: underline !important;
            }
            img {
              max-width: 100% !important;
              height: auto !important;
            }
            table {
              border-collapse: collapse !important;
              width: 100% !important;
            }
            th, td {
              border: 1px solid #dddddd !important;
              padding: 8px !important;
              text-align: left !important;
            }
          `;
          clonedDoc.head.appendChild(style);
        }
      });

      // Удаляем временный контейнер
      document.body.removeChild(tempContainer);

      // Создаем PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: 'a4'
      });

      const imgData = canvas.toDataURL('image/png');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Рассчитываем размеры изображения
      const imgWidth = pageWidth - 40; // отступы по 20px с каждой стороны
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 20;
      let pageNumber = 1;

      // Добавляем первую страницу
      pdf.addImage(imgData, 'PNG', 20, position, imgWidth, imgHeight, undefined, 'FAST');
      
      // Добавляем нижний колонтитул
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Страница ${pageNumber}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      
      heightLeft -= pageHeight;

      // Добавляем дополнительные страницы если нужно
      while (heightLeft > 0) {
        pdf.addPage();
        pageNumber++;
        position = heightLeft - imgHeight + 20;
        pdf.addImage(imgData, 'PNG', 20, position, imgWidth, imgHeight, undefined, 'FAST');
        pdf.text(`Страница ${pageNumber}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        heightLeft -= pageHeight;
      }

      // Добавляем метаданные
      pdf.setProperties({
        title: title,
        subject: 'Документация',
        author: 'Gicam Dock',
        keywords: 'documentation, guide, manual',
        creator: 'Gicam Dock PDF Generator'
      });

      // Сохраняем PDF
      const fileName = title
        .toLowerCase()
        .replace(/[^\w\s]/g, '') // Удаляем спецсимволы
        .replace(/\s+/g, '-') // Заменяем пробелы на дефисы
        .substring(0, 50) + '.pdf'; // Ограничиваем длину
      
      pdf.save(fileName);

    } catch (error) {
      console.error('Ошибка генерации PDF:', error);
      alert('Не удалось сгенерировать PDF. Пожалуйста, попробуйте позже.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="flex items-center gap-2 print:hidden">
      {/* Кнопка печати */}
      <button
        onClick={handlePrint}
        disabled={isPrinting}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white dark:bg-black/30 border border-black/10 dark:border-white/10 hover:border-black/30 dark:hover:border-white/30 rounded-lg transition-all duration-200 disabled:opacity-50 group"
        title="Печать страницы"
      >
        {isPrinting ? (
          <>
            <span className="animate-spin">⏳</span>
            <span className="hidden sm:inline">Подготовка...</span>
          </>
        ) : (
          <>
            <span className="group-hover:scale-110 transition-transform">🖨️</span>
            <span className="hidden sm:inline">Печать</span>
          </>
        )}
      </button>
      
      {/* Кнопка PDF */}
      <button
        onClick={generatePDF}
        disabled={isGeneratingPDF}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white dark:bg-black/30 border border-black/10 dark:border-white/10 hover:border-black/30 dark:hover:border-white/30 rounded-lg transition-all duration-200 disabled:opacity-50 group"
        title="Скачать в PDF"
      >
        {isGeneratingPDF ? (
          <>
            <span className="animate-spin">⏳</span>
            <span className="hidden sm:inline">Генерация...</span>
          </>
        ) : (
          <>
            <span className="group-hover:scale-110 transition-transform">📥</span>
            <span className="hidden sm:inline">PDF</span>
          </>
        )}
      </button>
    </div>
  );
}