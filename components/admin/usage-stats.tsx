"use client";

interface UsageStatsProps {
  onClose: () => void;
}

export function UsageStats({ onClose }: UsageStatsProps) {
  const stats = {
    totalViews: 15420,
    uniqueVisitors: 3241,
    avgTimeOnPage: '4:32',
    bounceRate: '32%',
    topPages: [
      { path: '/docs/getting-started', views: 3240, trend: '+12%' },
      { path: '/docs/api/authentication', views: 2150, trend: '+8%' },
      { path: '/docs/guides/deployment', views: 1890, trend: '+15%' },
      { path: '/docs/examples/react', views: 1430, trend: '-2%' },
      { path: '/docs/faq', views: 980, trend: '+5%' },
    ],
    recentSearches: [
      { query: 'api key', count: 45 },
      { query: 'authentication', count: 38 },
      { query: 'deployment', count: 32 },
      { query: 'react components', count: 28 },
      { query: 'error handling', count: 24 },
    ],
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-black rounded-2xl border border-black/10 dark:border-white/10 w-full max-w-4xl max-h-[80vh] flex flex-col shadow-2xl">
        
        {/* Заголовок */}
        <div className="px-6 py-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black/5 dark:bg-white/5 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
            <div>
              <h2 className="text-lg font-light text-black/80 dark:text-white/80">
                Статистика использования
              </h2>
              <p className="text-sm text-black/40 dark:text-white/40">
                Аналитика за последние 30 дней
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-black/40 dark:text-white/40"
          >
            ✕
          </button>
        </div>

        {/* Основной контент */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Основные метрики */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="p-4 bg-black/5 dark:bg-white/5 rounded-xl">
              <p className="text-xs text-black/40 dark:text-white/40 mb-1">Просмотры</p>
              <p className="text-2xl font-light text-black/80 dark:text-white/80">
                {stats.totalViews.toLocaleString()}
              </p>
            </div>
            <div className="p-4 bg-black/5 dark:bg-white/5 rounded-xl">
              <p className="text-xs text-black/40 dark:text-white/40 mb-1">Посетители</p>
              <p className="text-2xl font-light text-black/80 dark:text-white/80">
                {stats.uniqueVisitors.toLocaleString()}
              </p>
            </div>
            <div className="p-4 bg-black/5 dark:bg-white/5 rounded-xl">
              <p className="text-xs text-black/40 dark:text-white/40 mb-1">Время на странице</p>
              <p className="text-2xl font-light text-black/80 dark:text-white/80">
                {stats.avgTimeOnPage}
              </p>
            </div>
            <div className="p-4 bg-black/5 dark:bg-white/5 rounded-xl">
              <p className="text-xs text-black/40 dark:text-white/40 mb-1">Отказы</p>
              <p className="text-2xl font-light text-black/80 dark:text-white/80">
                {stats.bounceRate}
              </p>
            </div>
          </div>

          {/* Популярные страницы */}
          <div className="mb-8">
            <h3 className="text-sm font-medium text-black/60 dark:text-white/60 mb-4">
              Популярные страницы
            </h3>
            <div className="space-y-2">
              {stats.topPages.map((page, i) => (
                <div key={i} className="flex items-center justify-between p-3 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors">
                  <div className="flex-1">
                    <p className="text-sm text-black/80 dark:text-white/80">{page.path}</p>
                    <p className="text-xs text-black/40 dark:text-white/40">{page.views.toLocaleString()} просмотров</p>
                  </div>
                  <span className={`text-xs ${page.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                    {page.trend}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Популярные поисковые запросы */}
          <div>
            <h3 className="text-sm font-medium text-black/60 dark:text-white/60 mb-4">
              Популярные поисковые запросы
            </h3>
            <div className="space-y-2">
              {stats.recentSearches.map((search, i) => (
                <div key={i} className="flex items-center justify-between p-3 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors">
                  <span className="text-sm text-black/80 dark:text-white/80">{search.query}</span>
                  <span className="text-xs text-black/40 dark:text-white/40">{search.count} раз</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}