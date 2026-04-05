// buildMediaCard: 画像カード生成
export function buildMediaCard(url) {
	const card = document.createElement('div');
	card.className = 'media-card';
	card.contentEditable = 'false';
	// 画像URLが空の場合はno_image.pngを表示
	const imageUrl = url && url.trim() !== '' ? url : '/images/no_image.png';
	card.innerHTML = `<img src="${imageUrl}" alt="image" style="max-width:100%;max-height:100%;display:block;">`;
	return card;
}

// buildFormulaCard: 数式カード生成
export function buildFormulaCard(formula) {
	const card = document.createElement('div');
	card.className = 'formula-card';
	card.contentEditable = 'false';
	// プレビュー用: そのままテキスト表示（本番はKaTeX/MathJax等で描画）
	card.innerHTML = `<div class="formula-card-body">${formula}</div>`;
	return card;
}
// 各種カード（テキスト/コード/数式/画像/URL）の生成・編集・削除ロジック
// 必要に応じてcard_utils.js, card_modal.jsをimport

// 例: import { escapeHtml, encodeBase64Utf8, decodeBase64Utf8, decodeSerializedPayload } from './card_utils';
// 例: import { ensureTextModal, ensureCodeModal, ensureFormulaModal } from './card_modal';


// buildUrlCard: URLカード生成
export function buildUrlCard(url) {
	const card = document.createElement('div');
	card.className = 'url-card';
	card.contentEditable = 'false';
	card.innerHTML = `<div class="url-card-body">${url ? `<a href="${url}" target="_blank" rel="noopener">${url}</a>` : ''}</div>`;
	return card;
}
