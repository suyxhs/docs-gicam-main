import React, { JSX } from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Используем встроенные шрифты Helvetica (поддерживает кириллицу)
const styles = StyleSheet.create({
  page: {
    padding: 50,
    paddingTop: 40,
    paddingBottom: 65,
    fontFamily: 'Helvetica',
    fontSize: 11,
    lineHeight: 1.6,
    backgroundColor: '#ffffff',
    color: '#1e293b',
  },
  
  header: {
    marginBottom: 40,
    borderBottomWidth: 2,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 25,
  },
  
  title: {
    fontSize: 36,
    fontWeight: 700,
    marginBottom: 12,
    color: '#0f172a',
    letterSpacing: -0.02,
  },
  
  metadata: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  
  date: {
    fontSize: 10,
    color: '#64748b',
  },
  
  stats: {
    flexDirection: 'row',
    gap: 20,
  },
  
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  
  statText: {
    fontSize: 9,
    color: '#64748b',
  },
  
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 15,
  },
  
  tag: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  
  tagText: {
    fontSize: 8,
    color: '#64748b',
  },
  
  heading1: {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 16,
    marginTop: 24,
    color: '#0f172a',
    letterSpacing: -0.01,
  },
  
  heading2: {
    fontSize: 18,
    fontWeight: 600,
    marginBottom: 12,
    marginTop: 20,
    color: '#334155',
  },
  
  heading3: {
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 8,
    marginTop: 16,
    color: '#334155',
  },
  
  paragraph: {
    marginBottom: 12,
    color: '#1e293b',
  },
  
  codeBlock: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontFamily: 'Courier',
    fontSize: 9,
  },
  
  listItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  
  listBullet: {
    width: 15,
    fontSize: 11,
    color: '#64748b',
  },
  
  listText: {
    flex: 1,
    color: '#1e293b',
  },
  
  blockquote: {
    marginLeft: 0,
    paddingLeft: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#e2e8f0',
    marginBottom: 16,
    fontStyle: 'italic',
    color: '#64748b',
  },
  
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    fontSize: 8,
    color: '#94a3b8',
  },
  
  pageNumber: {
    textAlign: 'center',
  },
  
  watermark: {
    position: 'absolute',
    bottom: 150,
    right: 50,
    fontSize: 60,
    color: '#f1f5f9',
    transform: 'rotate(-30deg)',
    opacity: 0.3,
  },
  
  emptyView: {
    height: 10,
  },
});

interface ProfessionalPDFProps {
  title: string;
  content: string;
  author?: string;
  createdAt?: Date;
  wordCount?: number;
  readingTime?: number;
  tags?: string[];
  showWatermark?: boolean;
  companyName?: string;
}

// Простой парсер Markdown
const parseMarkdown = (content: string): JSX.Element[] => {
  const elements: JSX.Element[] = [];
  const lines = content.split('\n');
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  
  lines.forEach((line, index) => {
    // Код-блоки
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <View key={`code-${index}`} style={styles.codeBlock}>
            <Text>{codeBlockContent.join('\n')}</Text>
          </View>
        );
        codeBlockContent = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      return;
    }
    
    if (inCodeBlock) {
      codeBlockContent.push(line);
      return;
    }
    
    // Заголовки
    if (line.startsWith('# ')) {
      elements.push(<Text key={index} style={styles.heading1}>{line.substring(2)}</Text>);
    } else if (line.startsWith('## ')) {
      elements.push(<Text key={index} style={styles.heading2}>{line.substring(3)}</Text>);
    } else if (line.startsWith('### ')) {
      elements.push(<Text key={index} style={styles.heading3}>{line.substring(4)}</Text>);
    } 
    // Списки
    else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <View key={index} style={styles.listItem}>
          <Text style={styles.listBullet}>•</Text>
          <Text style={styles.listText}>{line.substring(2)}</Text>
        </View>
      );
    } 
    // Цитаты
    else if (line.startsWith('> ')) {
      elements.push(<Text key={index} style={styles.blockquote}>{line.substring(2)}</Text>);
    } 
    // Пустые строки
    else if (line.trim() === '') {
      elements.push(<View key={index} style={styles.emptyView} />);
    } 
    // Обычный текст
    else {
      elements.push(<Text key={index} style={styles.paragraph}>{line}</Text>);
    }
  });
  
  // Добавляем оставшийся код
  if (inCodeBlock && codeBlockContent.length > 0) {
    elements.push(
      <View key="code-end" style={styles.codeBlock}>
        <Text>{codeBlockContent.join('\n')}</Text>
      </View>
    );
  }
  
  return elements;
};

export const ProfessionalPDF: React.FC<ProfessionalPDFProps> = ({ 
  title, 
  content, 
  author = 'Gicam Dock',
  createdAt = new Date(),
  wordCount,
  readingTime,
  tags = [],
  showWatermark = true,
  companyName = 'Gicam Dock',
}) => {
  const words = wordCount || content.split(/\s+/).length;
  const readTime = readingTime || Math.ceil(words / 200);
  
  const parsedContent = parseMarkdown(content);
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Водяной знак */}
        {showWatermark ? (
          <Text style={styles.watermark}>{companyName}</Text>
        ) : null}
        
        {/* Заголовок */}
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          
          {/* Метаданные */}
          <View style={styles.metadata}>
            <Text style={styles.date}>
              {createdAt.toLocaleDateString('ru-RU', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Text>
            
            <View style={styles.stats}>
              <View style={styles.statItem}>
                <Text style={styles.statText}>{words} слов</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statText}>{readTime} мин чтения</Text>
              </View>
            </View>
          </View>
          
          {/* Теги */}
          {tags.length > 0 ? (
            <View style={styles.tagsContainer}>
              {tags.map((tag, i) => (
                <View key={i} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        {/* Контент */}
        <View>
          {parsedContent}
        </View>

        {/* Нижний колонтитул */}
        <View style={styles.footer} fixed>
          <Text>Сгенерировано в {companyName} • {author}</Text>
          <Text render={({ pageNumber, totalPages }) => (
            `${pageNumber} / ${totalPages}`
          )} style={styles.pageNumber} />
        </View>
      </Page>
    </Document>
  );
};