from fastapi import APIRouter, Response
import httpx, re
from datetime import datetime

router = APIRouter()

RSS_URL = "https://feeds.bbci.co.uk/sport/tennis/rss.xml"

def _parse_rss(xml: str) -> list:
    items = re.findall(r'<item>(.*?)</item>', xml, re.DOTALL)
    articles = []
    for item in items[:15]:
        def g(tag, txt=item):
            m = re.search(rf'<{tag}><!\[CDATA\[(.*?)\]\]>', txt, re.DOTALL)
            if not m: m = re.search(rf'<{tag}>(.*?)</{tag}>', txt, re.DOTALL)
            return m.group(1).strip() if m else ''

        link = g('link') or g('guid')
        desc = re.sub(r'<[^>]+>', '', g('description'))[:200]
        pub = g('pubDate')

        # Parse image from media:thumbnail or enclosure
        img = ''
        m_img = re.search(r'media:thumbnail[^>]*url="([^"]+)"', item)
        if m_img: img = m_img.group(1)

        articles.append({
            'title':       g('title'),
            'link':        link,
            'description': desc,
            'published':   pub,
            'image':       img,
            'source':      'BBC Sport',
        })
    return [a for a in articles if a['title']]


@router.get("/news")
async def get_news(response: Response):
    try:
        async with httpx.AsyncClient() as c:
            r = await c.get(RSS_URL, timeout=8, headers={'User-Agent': 'TennisAce/1.0'})
            articles = _parse_rss(r.text)
            response.headers["Cache-Control"] = "public, max-age=1800"
            return {"articles": articles, "count": len(articles)}
    except Exception:
        return {"articles": [], "count": 0}
