
import { ensureTextModal, ensureCodeModal, ensureFormulaModal, ensureMediaModal, ensureFormulaModalWithPreview } from './card_modal';
import { buildMediaCard, buildFormulaCard } from './card_builder';
// import { buildTextCard, setCardMoveHandlers, syncHiddenField, serializeTextCard } from './card_builder';
// 上記は今後分割予定。ここでは最低限のテキストカード追加のみ直書き。

document.addEventListener('DOMContentLoaded', initContentEditableEditor);
document.addEventListener('turbolinks:load', initContentEditableEditor);

function showCardTypeSelectModal(onSelect) {
	// 既存モーダルがあれば削除
	const old = document.getElementById('card-type-select-modal');
	if (old) old.remove();
	const overlay = document.createElement('div');
	overlay.id = 'card-type-select-modal';
	overlay.style.position = 'fixed';
	overlay.style.inset = 0;
	overlay.style.background = 'rgba(0,0,0,0.3)';
	overlay.style.zIndex = 9999;
	overlay.style.display = 'flex';
	overlay.style.alignItems = 'center';
	overlay.style.justifyContent = 'center';
	const modal = document.createElement('div');
	modal.style.background = '#fff';
	modal.style.borderRadius = '8px';
	modal.style.boxShadow = '0 4px 24px rgba(0,0,0,0.18)';
	modal.style.padding = '32px 24px';
	modal.style.minWidth = '320px';
	modal.innerHTML = `
		<h5 style="margin-bottom:18px;">カードの種類を選択</h5>
		<div style="display:flex; flex-direction:column; gap:12px;">
			<button class="btn btn-outline-primary" data-type="text">テキスト</button>
			<button class="btn btn-outline-primary" data-type="image">画像</button>
			<button class="btn btn-outline-primary" data-type="url">URL</button>
			<button class="btn btn-outline-primary" data-type="code">コード</button>
			<button class="btn btn-outline-primary" data-type="formula">数式</button>
			<button class="btn btn-secondary" data-type="cancel" style="margin-top:10px;">キャンセル</button>
		</div>
	`;
	overlay.appendChild(modal);
	document.body.appendChild(overlay);
	modal.querySelectorAll('button[data-type]').forEach(btn => {
		btn.addEventListener('click', () => {
			const type = btn.getAttribute('data-type');
			overlay.remove();
			if (type !== 'cancel') onSelect(type);
		});
	});
}

function insertAddCardButtons(bodyEditor) {
		// カードリスト取得
		const cards = Array.from(bodyEditor.querySelectorAll('.text-card, .code-card, .formula-card, .media-card, .url-card'));
		// 既存カードの操作ボタンにイベントを付与
		cards.forEach(card => {
			// 編集
			const editBtn = card.querySelector('.card-edit-btn');
			if (editBtn) {
				editBtn.onclick = function(e) {
					e.stopPropagation();
					if (card.classList.contains('text-card')) {
						const modal = ensureTextModal();
						const body = card.querySelector('.text-card-body');
						modal.textarea.value = body ? body.innerHTML.replace(/<br>/g, '\n') : '';
						modal.overlay.style.display = 'flex';
						modal.overlay.classList.add('is-open');
						modal.textarea.focus();
						const onSave = () => {
							const text = modal.textarea.value;
							if (text.trim()) {
								body.innerHTML = text.replace(/\n/g, '<br>');
							}
							modal.overlay.classList.remove('is-open');
							modal.overlay.style.display = 'none';
							modal.saveBtn.removeEventListener('click', onSave);
							modal.cancelBtn.removeEventListener('click', onCancel);
						};
						const onCancel = () => {
							modal.overlay.classList.remove('is-open');
							modal.overlay.style.display = 'none';
							modal.saveBtn.removeEventListener('click', onSave);
							modal.cancelBtn.removeEventListener('click', onCancel);
						};
						modal.saveBtn.addEventListener('click', onSave);
						modal.cancelBtn.addEventListener('click', onCancel);
					} else if (card.classList.contains('code-card')) {
						const modal = ensureCodeModal();
						const body = card.querySelector('.code-card-body');
						modal.textarea.value = body ? body.textContent : '';
						modal.overlay.style.display = 'flex';
						modal.overlay.classList.add('is-open');
						modal.textarea.focus();
						const onSave = () => {
							const code = modal.textarea.value;
							if (code.trim()) {
								body.textContent = code;
							}
							modal.overlay.classList.remove('is-open');
							modal.overlay.style.display = 'none';
							modal.saveBtn.removeEventListener('click', onSave);
							modal.cancelBtn.removeEventListener('click', onCancel);
						};
						const onCancel = () => {
							modal.overlay.classList.remove('is-open');
							modal.overlay.style.display = 'none';
							modal.saveBtn.removeEventListener('click', onSave);
							modal.cancelBtn.removeEventListener('click', onCancel);
						};
						modal.saveBtn.addEventListener('click', onSave);
						modal.cancelBtn.addEventListener('click', onCancel);
					} else if (card.classList.contains('formula-card')) {
						const modal = ensureFormulaModal();
						const body = card.querySelector('.formula-card-body');
						modal.textarea.value = body ? body.textContent : '';
						modal.overlay.style.display = 'flex';
						modal.overlay.classList.add('is-open');
						modal.textarea.focus();
						const onSave = () => {
							const formula = modal.textarea.value;
							if (formula.trim()) {
								body.textContent = formula;
							}
							modal.overlay.classList.remove('is-open');
							modal.overlay.style.display = 'none';
							modal.saveBtn.removeEventListener('click', onSave);
							modal.cancelBtn.removeEventListener('click', onCancel);
						};
						const onCancel = () => {
							modal.overlay.classList.remove('is-open');
							modal.overlay.style.display = 'none';
							modal.saveBtn.removeEventListener('click', onSave);
							modal.cancelBtn.removeEventListener('click', onCancel);
						};
						modal.saveBtn.addEventListener('click', onSave);
						modal.cancelBtn.addEventListener('click', onCancel);
					} else if (card.classList.contains('media-card')) {
						const img = card.querySelector('img');
						const url = img ? img.src : '';
						const newUrl = prompt('画像URLを編集してください:', url);
						if (newUrl && newUrl.trim()) {
							img.src = newUrl;
						}
					} else if (card.classList.contains('url-card')) {
						const body = card.querySelector('.url-card-body a');
						const url = body ? body.href : '';
						const newUrl = prompt('URLを編集してください:', url);
						if (newUrl && newUrl.trim()) {
							body.href = newUrl;
							body.textContent = newUrl;
						}
					}
				};
			}
			// 削除
			const delBtn = card.querySelector('.card-delete-btn');
			if (delBtn) {
				delBtn.onclick = function(e) {
					e.stopPropagation();
					card.remove();
					insertAddCardButtons(bodyEditor);
				};
			}
			// 上へ
			const upBtn = card.querySelector('.card-move-up-btn');
			if (upBtn) {
				upBtn.onclick = function(e) {
					e.stopPropagation();
					if (card.previousElementSibling && !card.previousElementSibling.classList.contains('add-card-btn-row')) {
						bodyEditor.insertBefore(card, card.previousElementSibling);
						insertAddCardButtons(bodyEditor);
					}
				};
			}
			// 下へ
			const downBtn = card.querySelector('.card-move-down-btn');
			if (downBtn) {
				downBtn.onclick = function(e) {
					e.stopPropagation();
					if (card.nextElementSibling && !card.nextElementSibling.classList.contains('add-card-btn-row')) {
						bodyEditor.insertBefore(card.nextElementSibling, card);
						insertAddCardButtons(bodyEditor);
					}
				};
			}
		});
	// 既存の追加ボタンを全て削除
	bodyEditor.querySelectorAll('.add-card-btn-row').forEach(btn => btn.remove());
	// n+1個の位置に追加ボタンを挿入
	for (let i = 0; i <= cards.length; i++) {
		const addBtnRow = document.createElement('div');
		addBtnRow.className = 'add-card-btn-row';
		addBtnRow.style.textAlign = 'center';
		addBtnRow.style.margin = '8px 0';
		const addBtn = document.createElement('button');
		addBtn.type = 'button';
		addBtn.className = 'btn btn-outline-primary add-card-btn';
		addBtn.textContent = '＋ カード追加';
		addBtn.addEventListener('click', function(e) {
			e.preventDefault();
			showCardTypeSelectModal(function(type) {
				if (type === 'text') {
					const modal = ensureTextModal();
					modal.textarea.value = '';
					modal.overlay.style.display = 'flex';
					modal.overlay.classList.add('is-open');
					modal.textarea.focus();
					const onSave = () => {
						const text = modal.textarea.value;
						if (text.trim()) {
							const card = document.createElement('div');
							card.className = 'text-card';
							card.contentEditable = 'false';
							card.innerHTML = `<div class="text-card-body">${text.replace(/\n/g, '<br>')}</div>` + cardActionButtonsHTML();
							if (i < cards.length) {
								bodyEditor.insertBefore(card, cards[i]);
							} else {
								bodyEditor.appendChild(card);
							}
						}
						modal.overlay.classList.remove('is-open');
						modal.overlay.style.display = 'none';
						modal.saveBtn.removeEventListener('click', onSave);
						modal.cancelBtn.removeEventListener('click', onCancel);
						insertAddCardButtons(bodyEditor);
					};
					const onCancel = () => {
						modal.overlay.classList.remove('is-open');
						modal.overlay.style.display = 'none';
						modal.saveBtn.removeEventListener('click', onSave);
						modal.cancelBtn.removeEventListener('click', onCancel);
					};
					modal.saveBtn.addEventListener('click', onSave);
					modal.cancelBtn.addEventListener('click', onCancel);
				} else if (type === 'image') {
					// 画像カード挿入モーダル
					const url = prompt('画像URLを入力してください:');
					if (url && url.trim()) {
						const card = document.createElement('div');
						card.className = 'media-card';
						card.contentEditable = 'false';
						card.innerHTML = `<img src="${url}" alt="image" style="max-width:100%;max-height:100%;display:block;">` + cardActionButtonsHTML();
						if (i < cards.length) {
							bodyEditor.insertBefore(card, cards[i]);
						} else {
							bodyEditor.appendChild(card);
						}
						insertAddCardButtons(bodyEditor);
					}
				} else if (type === 'image') {
					// 画像カード挿入モーダル（専用UI＋プレビュー）
					const modal = ensureMediaModal();
					modal.urlInput.value = '';
					modal.preview.src = '';
					modal.preview.style.display = 'none';
					modal.overlay.style.display = 'flex';
					modal.overlay.classList.add('is-open');
					modal.urlInput.focus();
					const onSave = () => {
						const url = modal.urlInput.value.trim();
						if (url) {
							const card = buildMediaCard(url);
							card.innerHTML += cardActionButtonsHTML();
							if (i < cards.length) {
								bodyEditor.insertBefore(card, cards[i]);
							} else {
								bodyEditor.appendChild(card);
							}
						}
						modal.overlay.classList.remove('is-open');
						modal.overlay.style.display = 'none';
						modal.saveBtn.removeEventListener('click', onSave);
						modal.cancelBtn.removeEventListener('click', onCancel);
						insertAddCardButtons(bodyEditor);
					};
					const onCancel = () => {
						modal.overlay.classList.remove('is-open');
						modal.overlay.style.display = 'none';
						modal.saveBtn.removeEventListener('click', onSave);
						modal.cancelBtn.removeEventListener('click', onCancel);
					};
					modal.saveBtn.addEventListener('click', onSave);
					modal.cancelBtn.addEventListener('click', onCancel);
				} else if (type === 'code') {
					// コードカード挿入モーダル
					const modal = ensureCodeModal();
					modal.textarea.value = '';
					modal.overlay.style.display = 'flex';
					modal.overlay.classList.add('is-open');
					modal.textarea.focus();
					const onSave = () => {
						const code = modal.textarea.value;
						if (code.trim()) {
							const card = document.createElement('div');
							card.className = 'code-card';
							card.contentEditable = 'false';
							card.innerHTML = `<pre class="code-card-body">${code.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre>` + cardActionButtonsHTML();
							if (i < cards.length) {
								bodyEditor.insertBefore(card, cards[i]);
							} else {
								bodyEditor.appendChild(card);
							}
						}
						modal.overlay.classList.remove('is-open');
						modal.overlay.style.display = 'none';
						modal.saveBtn.removeEventListener('click', onSave);
						modal.cancelBtn.removeEventListener('click', onCancel);
						insertAddCardButtons(bodyEditor);
					};
					const onCancel = () => {
						modal.overlay.classList.remove('is-open');
						modal.overlay.style.display = 'none';
						modal.saveBtn.removeEventListener('click', onSave);
						modal.cancelBtn.removeEventListener('click', onCancel);
					};
					modal.saveBtn.addEventListener('click', onSave);
					modal.cancelBtn.addEventListener('click', onCancel);
				} else if (type === 'formula') {
					// 数式カード挿入モーダル（専用UI＋プレビュー）
					const modal = ensureFormulaModalWithPreview();
					modal.textarea.value = '';
					modal.preview.textContent = '';
					modal.overlay.style.display = 'flex';
					modal.overlay.classList.add('is-open');
					modal.textarea.focus();
					const onSave = () => {
						const formula = modal.textarea.value.trim();
						if (formula) {
							const card = buildFormulaCard(formula);
							card.innerHTML += cardActionButtonsHTML();
							if (i < cards.length) {
								bodyEditor.insertBefore(card, cards[i]);
							} else {
								bodyEditor.appendChild(card);
							}
						}
						modal.overlay.classList.remove('is-open');
						modal.overlay.style.display = 'none';
						modal.saveBtn.removeEventListener('click', onSave);
						modal.cancelBtn.removeEventListener('click', onCancel);
						insertAddCardButtons(bodyEditor);
					};
					const onCancel = () => {
						modal.overlay.classList.remove('is-open');
						modal.overlay.style.display = 'none';
						modal.saveBtn.removeEventListener('click', onSave);
						modal.cancelBtn.removeEventListener('click', onCancel);
					};
					modal.saveBtn.addEventListener('click', onSave);
					modal.cancelBtn.addEventListener('click', onCancel);
				}
			});
		});
		addBtnRow.appendChild(addBtn);
		if (i < cards.length) {
			bodyEditor.insertBefore(addBtnRow, cards[i]);
		} else {
			bodyEditor.appendChild(addBtnRow);
		}
	}
}

// カード共通の編集・削除・上下ボタンHTML
function cardActionButtonsHTML() {
  return `
    <button class="card-move-up-btn" type="button" contenteditable="false" style="position: absolute; top: 0; right: 110px; background: #6c757d; color: white; border: none; padding: 2px 6px; border-radius: 2px; font-size: 10px; cursor: pointer;">↑</button>
    <button class="card-move-down-btn" type="button" contenteditable="false" style="position: absolute; top: 0; right: 74px; background: #6c757d; color: white; border: none; padding: 2px 6px; border-radius: 2px; font-size: 10px; cursor: pointer;">↓</button>
    <button class="card-edit-btn" type="button" contenteditable="false" style="position: absolute; top: 0; right: 38px; background: #0d6efd; color: white; border: none; padding: 2px 6px; border-radius: 2px; font-size: 10px; cursor: pointer;">編集</button>
    <button class="card-delete-btn" type="button" contenteditable="false" style="position: absolute; top: 0; right: 2px; background: #dc3545; color: white; border: none; padding: 2px 6px; border-radius: 2px; font-size: 9px; cursor: pointer;">削除</button>
  `;
}
function initContentEditableEditor() {
	const bodyEditor = document.getElementById('body-editor');
	if (!bodyEditor || bodyEditor.dataset.initialized === 'true') return;
	bodyEditor.dataset.initialized = 'true';

	insertAddCardButtons(bodyEditor);

	// 入力・貼り付け・キー操作を全て禁止
	bodyEditor.addEventListener('beforeinput', (e) => { e.preventDefault(); });
	bodyEditor.addEventListener('paste', (e) => { e.preventDefault(); });
	bodyEditor.addEventListener('keydown', (e) => {
		if (!e.ctrlKey && !e.metaKey && !['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Tab'].includes(e.key)) {
			e.preventDefault();
		}
	});
}
