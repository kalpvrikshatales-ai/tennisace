interface Article {
  title: string
  link: string
  description: string
  published: string
  image?: string
  source: string
}

interface Props { article: Article; index: number }

function timeAgo(pub: string) {
  if (!pub) return ''
  const d = new Date(pub)
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function NewsCard({ article, index }: Props) {
  return (
    <a
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      className="block card rounded-2xl overflow-hidden hover:border-gray-300 transition-all"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      {article.image && (
        <div className="w-full h-40 overflow-hidden bg-gray-100">
          <img
            src={article.image}
            alt=""
            className="w-full h-full object-cover"
            onError={e => (e.currentTarget.parentElement!.style.display = 'none')}
          />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-bold text-[#00C875] uppercase tracking-wider">{article.source}</span>
          <span className="text-gray-200">·</span>
          <span className="text-[10px] text-gray-400">{timeAgo(article.published)}</span>
        </div>
        <h3 className="text-sm font-bold text-gray-900 leading-snug mb-1.5 line-clamp-2">
          {article.title}
        </h3>
        {article.description && (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{article.description}</p>
        )}
      </div>
    </a>
  )
}
