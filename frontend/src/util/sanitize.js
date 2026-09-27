import DOMPurify from "dompurify";

// 与后端 bleach 白名单保持一致的纵深防御：
// 后端负责入库过滤，这里负责兜住历史脏数据和将来绕过前端的直接写入。
const ALLOWED_TAGS = [
  "p", "br", "div", "span", "blockquote", "pre", "code",
  "b", "strong", "i", "em", "u", "s", "del", "ins", "sub", "sup", "mark",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li", "dl", "dt", "dd",
  "a", "img", "figure", "figcaption", "hr",
  "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption",
];

const ALLOWED_ATTR = [
  "href", "title", "rel", "target", "src", "alt", "width", "height",
  "colspan", "rowspan", "class",
];

let hooked = false;

function ensureHook() {
  if (hooked) return;
  // 外链补 rel，避免 target=_blank 被反向控制 opener
  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if (node.tagName === "A" && node.getAttribute("target")) {
      node.setAttribute("rel", "noopener noreferrer");
    }
  });
  hooked = true;
}

export function sanitizeHtml(dirty) {
  if (!dirty || typeof dirty !== "string") return "";
  if (typeof window === "undefined") return "";
  ensureHook();
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ["style", "script", "iframe", "object", "embed", "form"],
    FORBID_ATTR: ["style"],
  });
}

export default sanitizeHtml;
