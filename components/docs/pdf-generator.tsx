"use client";

import { useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PDFGeneratorProps {
  title: string;
}

export function PDFGenerator({ title }: PDFGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    setIsGenerating(true);
    
    try {
      console.log("📄 Начинаем генерацию PDF...");
      
      // Находим основной контент
      const content = document.querySelector('.fumadocs-content, article, main, .prose') as HTMLElement;
      
      if (!content) {
        console.error("Контент не найден");
        alert("Не найден контент для генерации PDF");
        setIsGenerating(false);
        return;
      }

      // Создаем контейнер для PDF
      const container = document.createElement('div');
      container.style.width = '1000px';
      container.style.padding = '50px';
      container.style.backgroundColor = '#ffffff';
      container.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
      container.style.color = '#000000';
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.zIndex = '-1000';
      
      // Клонируем контент
      const clone = content.cloneNode(true) as HTMLElement;
      
      // Удаляем интерактивные элементы
      clone.querySelectorAll('button, nav, footer, svg, iframe, .print\\:hidden').forEach(el => el.remove());
      
      // Добавляем стили для изображений
      clone.querySelectorAll('img').forEach(el => {
        const img = el as HTMLImageElement;
        const originalSrc = img.getAttribute('src');
        if (originalSrc) {
          // Если изображение из public папки, преобразуем в полный URL
          if (originalSrc.startsWith('/')) {
            img.src = window.location.origin + originalSrc;
          }
          // Добавляем стили для изображений
          img.style.maxWidth = '100%';
          img.style.height = 'auto';
          img.style.margin = '20px 0';
          img.style.borderRadius = '8px';
          img.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
          
          // Добавляем атрибут crossOrigin для CORS
          img.crossOrigin = 'anonymous';
        }
      });

      // Добавляем стили для кода
      clone.querySelectorAll('pre').forEach(el => {
        const pre = el as HTMLElement;
        pre.style.backgroundColor = '#f8fafc';
        pre.style.padding = '16px';
        pre.style.borderRadius = '8px';
        pre.style.border = '1px solid #e2e8f0';
        pre.style.fontFamily = 'Courier, monospace';
        pre.style.fontSize = '12px';
        pre.style.overflow = 'auto';
        pre.style.margin = '20px 0';
      });

      clone.querySelectorAll('code').forEach(el => {
        const code = el as HTMLElement;
        code.style.backgroundColor = '#f1f5f9';
        code.style.padding = '2px 6px';
        code.style.borderRadius = '4px';
        code.style.fontFamily = 'Courier, monospace';
        code.style.fontSize = '12px';
      });

      // Добавляем стили для таблиц
      clone.querySelectorAll('table').forEach(el => {
        const table = el as HTMLElement;
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';
        table.style.margin = '20px 0';
        table.style.fontSize = '12px';
      });

      clone.querySelectorAll('th, td').forEach(el => {
        const cell = el as HTMLElement;
        cell.style.border = '1px solid #e2e8f0';
        cell.style.padding = '10px';
        cell.style.textAlign = 'left';
      });

      clone.querySelectorAll('th').forEach(el => {
        const th = el as HTMLElement;
        th.style.backgroundColor = '#f8fafc';
        th.style.fontWeight = '600';
      });

      // Добавляем стили для заголовков
      clone.querySelectorAll('h1').forEach(el => {
        const h1 = el as HTMLElement;
        h1.style.fontSize = '32px';
        h1.style.fontWeight = '700';
        h1.style.marginTop = '30px';
        h1.style.marginBottom = '20px';
        h1.style.color = '#0f172a';
      });

      clone.querySelectorAll('h2').forEach(el => {
        const h2 = el as HTMLElement;
        h2.style.fontSize = '24px';
        h2.style.fontWeight = '600';
        h2.style.marginTop = '25px';
        h2.style.marginBottom = '15px';
        h2.style.color = '#1e293b';
      });

      clone.querySelectorAll('h3').forEach(el => {
        const h3 = el as HTMLElement;
        h3.style.fontSize = '18px';
        h3.style.fontWeight = '600';
        h3.style.marginTop = '20px';
        h3.style.marginBottom = '10px';
        h3.style.color = '#334155';
      });

      // Стили для параграфов
      clone.querySelectorAll('p').forEach(el => {
        const p = el as HTMLElement;
        p.style.fontSize = '12px';
        p.style.lineHeight = '1.7';
        p.style.marginBottom = '15px';
        p.style.color = '#334155';
      });

      // Стили для списков
      clone.querySelectorAll('ul, ol').forEach(el => {
        const list = el as HTMLElement;
        list.style.marginBottom = '20px';
        list.style.paddingLeft = '25px';
      });

      clone.querySelectorAll('li').forEach(el => {
        const li = el as HTMLElement;
        li.style.fontSize = '12px';
        li.style.marginBottom = '5px';
        li.style.color = '#334155';
      });

      // Стили для цитат
      clone.querySelectorAll('blockquote').forEach(el => {
        const quote = el as HTMLElement;
        quote.style.borderLeft = '4px solid #cbd5e1';
        quote.style.paddingLeft = '20px';
        quote.style.marginLeft = '0';
        quote.style.marginRight = '0';
        quote.style.fontStyle = 'italic';
        quote.style.color = '#64748b';
        quote.style.margin = '20px 0';
      });

      // Добавляем заголовок документа
      const header = document.createElement('div');
      header.style.marginBottom = '40px';
      header.style.paddingBottom = '20px';
      header.style.borderBottom = '2px solid #e2e8f0';
      
      const titleEl = document.createElement('h1');
      titleEl.textContent = title;
      titleEl.style.fontSize = '36px';
      titleEl.style.fontWeight = '700';
      titleEl.style.marginBottom = '10px';
      titleEl.style.color = '#0f172a';
      
      const metaEl = document.createElement('div');
      metaEl.style.display = 'flex';
      metaEl.style.justifyContent = 'space-between';
      metaEl.style.alignItems = 'center';
      metaEl.style.color = '#64748b';
      metaEl.style.fontSize = '12px';
      
      const dateEl = document.createElement('span');
      dateEl.textContent = `📅 ${new Date().toLocaleDateString('ru-RU', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`;
      
      const wordCount = (clone.textContent || '').split(/\s+/).length;
      const statsEl = document.createElement('span');
      statsEl.textContent = `📄 ${wordCount} слов • ⏱️ ${Math.ceil(wordCount / 200)} мин`;
      
      metaEl.appendChild(dateEl);
      metaEl.appendChild(statsEl);
      
      header.appendChild(titleEl);
      header.appendChild(metaEl);
      
      container.appendChild(header);
      container.appendChild(clone);
      
      // Добавляем подвал
      const footer = document.createElement('div');
      footer.style.marginTop = '40px';
      footer.style.paddingTop = '20px';
      footer.style.borderTop = '2px solid #e2e8f0';
      footer.style.display = 'flex';
      footer.style.justifyContent = 'space-between';
      footer.style.alignItems = 'center';
      footer.style.fontSize = '10px';
      footer.style.color = '#94a3b8';
      
      const footerLeft = document.createElement('span');
      footerLeft.textContent = `Gicam Dock • ${new Date().getFullYear()}`;
      
      const footerRight = document.createElement('span');
      footerRight.textContent = `Страница 1`;
      
      footer.appendChild(footerLeft);
      footer.appendChild(footerRight);
      
      container.appendChild(footer);
      
      document.body.appendChild(container);

      // Ждем загрузки всех изображений с таймаутом
      const images = container.querySelectorAll('img');
      console.log(`🖼️ Найдено изображений: ${images.length}`);
      
      const imagePromises = Array.from(images).map(img => {
        if (img.complete) {
          console.log(`✅ Изображение уже загружено: ${img.src}`);
          return Promise.resolve();
        }
        
        return Promise.race([
          new Promise<void>((resolve) => {
            img.onload = () => {
              console.log(`✅ Изображение загружено: ${img.src}`);
              resolve();
            };
            img.onerror = () => {
              console.warn(`⚠️ Ошибка загрузки изображения: ${img.src}`);
              resolve(); // Продолжаем даже если изображение не загрузилось
            };
          }),
          new Promise<void>((resolve) => {
            // Таймаут 3 секунды на каждое изображение
            setTimeout(() => {
              console.warn(`⏱️ Таймаут загрузки изображения: ${img.src}`);
              resolve();
            }, 3000);
          })
        ]);
      });

      await Promise.all(imagePromises);
      console.log("✅ Все изображения обработаны");
      
      // Дополнительная задержка для рендеринга
      await new Promise(resolve => setTimeout(resolve, 500));

      // Конвертируем в canvas
      console.log("🎨 Конвертируем в canvas...");
      const canvas = await html2canvas(container, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 1000,
        allowTaint: true,
        useCORS: true,
        proxy: undefined,
        onclone: (clonedDoc) => {
          // Дополнительные стили для клонированного документа
          const style = clonedDoc.createElement('style');
          style.textContent = `
            * {
              color: #000000 !important;
            }
            img {
              max-width: 100% !important;
              height: auto !important;
            }
          `;
          clonedDoc.head.appendChild(style);
        }
      });

      console.log(`✅ Canvas создан: ${canvas.width}x${canvas.height}`);

      // Удаляем контейнер
      document.body.removeChild(container);

      // Создаем PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: 'a4'
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = pageWidth - 60;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 30;
      let pageNum = 1;

      // Добавляем первую страницу
      pdf.addImage(imgData, 'JPEG', 30, position, imgWidth, imgHeight, undefined, 'FAST');
      
      // Добавляем номер страницы
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`- ${pageNum} -`, pageWidth / 2, pageHeight - 20, { align: 'center' });
      
      heightLeft -= pageHeight;

      // Добавляем остальные страницы
      while (heightLeft > 0) {
        pdf.addPage();
        pageNum++;
        position = heightLeft - imgHeight + 30;
        pdf.addImage(imgData, 'JPEG', 30, position, imgWidth, imgHeight, undefined, 'FAST');
        pdf.text(`- ${pageNum} -`, pageWidth / 2, pageHeight - 20, { align: 'center' });
        heightLeft -= pageHeight;
      }

      // Сохраняем PDF
      const fileName = title
        .toLowerCase()
        .replace(/[^a-z0-9а-яё]/gi, '-')
        .replace(/-+/g, '-')
        .substring(0, 50) + '.pdf';
      
      pdf.save(fileName);
      console.log("✅ PDF сохранен");

    } catch (error) {
      console.error('❌ Ошибка генерации PDF:', error);
      alert('Не удалось сгенерировать PDF. Пожалуйста, попробуйте позже.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={generatePDF}
      disabled={isGenerating}
      className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-primary/10 text-primary border border-primary/20 hover:border-primary/30 disabled:opacity-50"
    >
      {isGenerating ? (
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
}