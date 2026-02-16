import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  
  // Настройка реврайтов для MDX файлов
  async rewrites() {
    return [
      {
        source: '/docs/:path*.mdx',
        destination: '/llms.mdx/docs/:path*',
      },
    ];
  },

  // Настройка для обработки медиафайлов
  images: {
    domains: ['localhost'],
    unoptimized: true, // Для оптимизации изображений из public папки
  },
  
  // Webpack конфигурация для статических файлов
  webpack: (config, { isServer }) => {
    // Добавляем правило для видео и медиафайлов
    config.module.rules.push({
      test: /\.(mp4|webm|mov|avi|mkv|flv|wmv|ogg|mp3|wav|flac|pdf|zip|rar|7z|doc|docx|xls|xlsx)$/,
      type: 'asset/resource',
      generator: {
        filename: 'static/media/[name].[hash][ext]',
      },
    });

    return config;
  },
  
  // Настройка для турбопака (если используется)
  experimental: {
    turbo: {
      rules: {
        '*.mp4': {
          loaders: [],
          as: 'static-file',
        },
        '*.mov': {
          loaders: [],
          as: 'static-file',
        },
        '*.webm': {
          loaders: [],
          as: 'static-file',
        },
        '*.avi': {
          loaders: [],
          as: 'static-file',
        },
        '*.mkv': {
          loaders: [],
          as: 'static-file',
        },
        '*.pdf': {
          loaders: [],
          as: 'static-file',
        },
        '*.zip': {
          loaders: [],
          as: 'static-file',
        },
        '*.rar': {
          loaders: [],
          as: 'static-file',
        },
        '*.doc': {
          loaders: [],
          as: 'static-file',
        },
        '*.docx': {
          loaders: [],
          as: 'static-file',
        },
      },
    },
  },
};

export default withMDX(config);