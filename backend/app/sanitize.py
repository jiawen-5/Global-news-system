"""新闻富文本入库前的 HTML 白名单过滤。

编辑器（draft-js）产出 HTML 字符串，直接入库再原样渲染会造成存储型 XSS，
例如 <img src=x onerror="..."> 会窃取登录凭证。这里在写库前统一做白名单清洗。
"""
import re

import bleach

# 允许的排版标签，够用即可；<script>/<iframe>/<object>/<style> 等一律不在白名单
ALLOWED_TAGS = [
    "p", "br", "div", "span", "blockquote", "pre", "code",
    "b", "strong", "i", "em", "u", "s", "del", "ins", "sub", "sup", "mark",
    "h1", "h2", "h3", "h4", "h5", "h6",
    "ul", "ol", "li", "dl", "dt", "dd",
    "a", "img", "figure", "figcaption", "hr",
    "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption",
]

# 只放行安全的展示属性，on* 事件属性全部不在列
ALLOWED_ATTRS = {
    "a": ["href", "title", "rel", "target"],
    "img": ["src", "alt", "title", "width", "height"],
    "td": ["colspan", "rowspan"],
    "th": ["colspan", "rowspan"],
    "*": ["class"],
}

# 不允许 data: / blob: / javascript: 之类协议，阻断 executeable URL
ALLOWED_PROTOCOLS = ["http", "https", "mailto"]

# 移除标签时连同内容一起删掉，避免标签里的文本残留成乱码
STRIP_CONTENT_TAGS = ["script", "style", "iframe", "object", "embed", "form", "noscript"]

_TAG_BLOCK_RE = re.compile(
    r"<\s*(%s)\b[^>]*>.*?<\s*/\s*\1\s*>" % "|".join(STRIP_CONTENT_TAGS),
    re.IGNORECASE | re.DOTALL,
)
_TAG_SELF_RE = re.compile(
    r"<\s*/?\s*(%s)\b[^>]*>" % "|".join(STRIP_CONTENT_TAGS),
    re.IGNORECASE,
)


def _strip_raw_tags(raw: str) -> str:
    """先整体删除 script/style 等标签（含内容）。

    bleach 默认只剥标签、保留正文，会把 CSS 和脚本代码残留成可见文本。
    """
    return _TAG_SELF_RE.sub("", _TAG_BLOCK_RE.sub("", raw))


def sanitize_html(raw):
    """清洗富文本 HTML，返回安全的 HTML 字符串。"""
    if raw is None:
        return raw
    if not isinstance(raw, str):
        raw = str(raw)
    if not raw.strip():
        return ""
    cleaned = bleach.clean(
        _strip_raw_tags(raw),
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRS,
        protocols=ALLOWED_PROTOCOLS,
        strip=True,
        strip_comments=True,
    )
    return cleaned.strip()


def sanitize_text(raw, max_len=255):
    """标题等纯文本字段：剥掉所有标签并截断。"""
    if raw is None:
        return raw
    if not isinstance(raw, str):
        raw = str(raw)
    plain = bleach.clean(_strip_raw_tags(raw), tags=[], attributes={},
                         strip=True, strip_comments=True)
    return plain.strip()[:max_len]
