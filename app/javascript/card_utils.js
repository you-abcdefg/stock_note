// 共通ユーティリティ（エスケープ・Base64・トークン変換など）

export function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

export function encodeBase64Utf8(value) {
  const utf8 = encodeURIComponent(value).replace(/%([0-9A-F]{2})/g, (_, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });
  return btoa(utf8);
}

export function decodeBase64Utf8(value) {
  const binary = atob(value);
  const escaped = Array.from(binary)
    .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
    .join('');
  return decodeURIComponent(escaped);
}

export function decodeSerializedPayload(tokenRegex, rawText) {
  const matched = (rawText || '').trim().match(tokenRegex);
  if (!matched) return null;
  try {
    return JSON.parse(decodeBase64Utf8(matched[1]));
  } catch (_error) {
    return null;
  }
}
