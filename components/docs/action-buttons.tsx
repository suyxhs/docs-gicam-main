"use client";

import { useState } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

interface DocsActionButtonsProps {
  title: string;
  url: string;
  githubUrl: string;
}

export function DocsActionButtons({ title, url, githubUrl }: DocsActionButtonsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
  ];

  const handlePrint = () => {
    window.print();
    setIsOpen(false);
  };

  const handlePDF = async () => {
    setIsGenerating(true);
    setIsOpen(false);
    
    try {
      console.log("📄 Начинаем генерацию PDF...");
      
      // Находим основной контент
      const content = document.querySelector('main, article, .fumadocs-content, .prose') as HTMLElement;
      
      if (!content) {
        throw new Error('Контент не найден');
      }

      // Создаем временный контейнер с простыми цветами
      const container = document.createElement('div');
      container.style.width = '1200px';
      container.style.padding = '60px';
      container.style.backgroundColor = '#ffffff';
      container.style.color = '#000000'; // Простой черный
      container.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
      container.style.lineHeight = '1.6';
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      
      // Клонируем контент
      const clone = content.cloneNode(true) as HTMLElement;
      
      // Удаляем интерактивные элементы
      clone.querySelectorAll('button, nav, footer, .print\\:hidden, svg, path').forEach(el => el.remove());
      
      // Применяем простые стили ко всем элементам
      const allElements = clone.querySelectorAll('*');
      allElements.forEach((el) => {
        if (el instanceof HTMLElement) {
          // Сбрасываем все сложные цвета на простые
          el.style.setProperty('color', '', 'important');
          el.style.setProperty('background-color', '', 'important');
          el.style.setProperty('border-color', '', 'important');
          
          // Убираем все переменные CSS
          for (let i = 0; i < el.style.length; i++) {
            const prop = el.style[i];
            if (prop.startsWith('--')) {
              el.style.removeProperty(prop);
            }
          }
        }
      });
      
      // Добавляем заголовок
      const header = document.createElement('div');
      header.style.marginBottom = '40px';
      header.style.paddingBottom = '20px';
      header.style.borderBottom = '2px solid #eaeaea';
      
      const titleEl = document.createElement('h1');
      titleEl.textContent = title;
      titleEl.style.fontSize = '36px';
      titleEl.style.fontWeight = '600';
      titleEl.style.marginBottom = '8px';
      titleEl.style.color = '#000000';
      titleEl.style.letterSpacing = '-0.02em';
      
      const dateEl = document.createElement('p');
      dateEl.textContent = `Сгенерировано: ${new Date().toLocaleDateString('ru-RU', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`;
      dateEl.style.fontSize = '14px';
      dateEl.style.color = '#666666';
      dateEl.style.margin = '0';
      
      header.appendChild(titleEl);
      header.appendChild(dateEl);
      container.appendChild(header);
      
      // Добавляем контент
      container.appendChild(clone);
      
      // Добавляем подвал
      const footer = document.createElement('div');
      footer.style.marginTop = '40px';
      footer.style.paddingTop = '20px';
      footer.style.borderTop = '1px solid #eaeaea';
      footer.style.fontSize = '12px';
      footer.style.color = '#666666';
      footer.style.textAlign = 'center';
      footer.innerHTML = `
        <p>© ${new Date().getFullYear()} Gicam Dock. Все права защищены.</p>
        <p style="margin-top: 4px;">Документация сгенерирована автоматически</p>
      `;
      container.appendChild(footer);
      
      document.body.appendChild(container);

      // Даем время на рендеринг
      await new Promise(resolve => setTimeout(resolve, 100));

      // Конвертируем в canvas с правильными настройками
      const canvas = await html2canvas(container, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 1200,
        allowTaint: false,
        useCORS: true,
        onclone: (clonedDoc) => {
          // В клоне документа тоже сбрасываем сложные цвета
          const clonedContainer = clonedDoc.querySelector('div');
          if (clonedContainer) {
            const style = clonedDoc.createElement('style');
            style.textContent = `
              * {
                color: #000000 !important;
                background-color: transparent !important;
                border-color: #dddddd !important;
              }
              body {
                background-color: #ffffff !important;
              }
              h1, h2, h3, h4, h5, h6 {
                color: #000000 !important;
              }
              p, li {
                color: #333333 !important;
              }
              pre, code {
                background-color: #f5f5f5 !important;
                color: #000000 !important;
                border: 1px solid #dddddd !important;
              }
              a {
                color: #0066cc !important;
              }
              table, th, td {
                border-color: #dddddd !important;
              }
              th {
                background-color: #f5f5f5 !important;
              }
            `;
            clonedDoc.head.appendChild(style);
          }
        }
      });

      document.body.removeChild(container);

      // Создаем PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: 'a4'
      });

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = pageWidth - 80;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 40;
      let pageNum = 1;

      pdf.addImage(imgData, 'JPEG', 40, position, imgWidth, imgHeight, undefined, 'FAST');
      
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Страница ${pageNum}`, pageWidth / 2, pageHeight - 20, { align: 'center' });
      
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        pdf.addPage();
        pageNum++;
        position = heightLeft - imgHeight + 40;
        pdf.addImage(imgData, 'JPEG', 40, position, imgWidth, imgHeight, undefined, 'FAST');
        pdf.text(`Страница ${pageNum}`, pageWidth / 2, pageHeight - 20, { align: 'center' });
        heightLeft -= pageHeight;
      }

      const fileName = title
        .toLowerCase()
        .replace(/[^\w\sа-яА-ЯёЁ]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50) + '.pdf';
      
      pdf.save(fileName);

    } catch (error) {
      console.error('❌ Ошибка:', error);
      
      let message = 'Не удалось сгенерировать PDF. ';
      if (error instanceof Error) {
        message += error.message;
      }
      alert(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const translatePage = (langCode: string, langName: string) => {
    setIsOpen(false);
    
    const currentUrl = encodeURIComponent(window.location.href);
    window.open(
      `https://translate.yandex.com/translate?lang=ru-${langCode}&url=${currentUrl}`,
      '_blank'
    );
  };

  return (
    <div className="flex flex-row items-center gap-2">
      {/* Кнопка Print */}
      <button
        onClick={handlePrint}
        className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-primary/10 text-primary border border-primary/20 hover:border-primary/30"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
        <span>Печать</span>
      </button>

      {/* Кнопка PDF */}
      <button
        onClick={handlePDF}
        disabled={isGenerating}
        className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-primary/10 text-primary border border-primary/20 hover:border-primary/30 disabled:opacity-50"
      >
        {isGenerating ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Генерация...</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>PDF</span>
          </>
        )}
      </button>

      {/* Кнопка Language */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-primary/10 text-primary border border-primary/20 hover:border-primary/30"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
          </svg>
          <span>Язык</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-primary/10 overflow-hidden z-50 animate-fadeIn">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => translatePage(lang.code, lang.name)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-primary/5 transition-colors text-left"
              >
                <span className="text-base">{lang.flag}</span>
                <span className="flex-1 text-gray-700 dark:text-gray-300">{lang.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}