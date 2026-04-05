// This file is automatically compiled by Webpack, along with any other files
// present in this directory. You're encouraged to place your actual application logic in
// a relevant structure within app/javascript and only use these pack files to reference
// that code so it'll be compiled.

import Rails from "@rails/ujs"
import Turbolinks from "turbolinks"
import * as ActiveStorage from "@rails/activestorage"
import "channels"
import "../posts_editor_main"
import "../posts_editor" // posts_editor.jsを明示的にimport

Rails.start()
// 「Rails.start(【引数】);」: Rails.startを呼び出して必要な処理を実行する
Turbolinks.start()
// 「Turbolinks.start(【引数】);」: Turbolinks.startを呼び出して必要な処理を実行する
ActiveStorage.start()
// 「ActiveStorage.start(【引数】);」: ActiveStorage.startを呼び出して必要な処理を実行する


// Turbo/Turbolinks両対応: グローバル初期化イベント
document.addEventListener('turbolinks:load', () => {
	if (window.initContentEditableEditor) {
		window.initContentEditableEditor();
	}
});
document.addEventListener('turbo:load', () => {
	if (window.initContentEditableEditor) {
		window.initContentEditableEditor();
	}
});

const restoreDisabledSubmitButtons = () => {
	document.querySelectorAll('form input[type="submit"][disabled], form button[type="submit"][disabled]').forEach((button) => {
		button.disabled = false;
	});
};

const bindPostBodyFallbackSync = () => {
	const bodyEditor = document.getElementById('body-editor');
	const bodyHidden = document.getElementById('body-hidden');
	if (!bodyEditor || !bodyHidden) return;

	const form = bodyEditor.closest('form');
	if (!form || form.dataset.bodyFallbackBound === 'true') return;

	const encodePayload = (payload) => {
		const utf8 = encodeURIComponent(JSON.stringify(payload)).replace(/%([0-9A-F]{2})/g, (_match, hex) =>
			String.fromCharCode(parseInt(hex, 16))
		);
		return btoa(utf8);
	};

	const serializeEditorCards = () => {
		const blocks = [];
		const cards = bodyEditor.querySelectorAll('.text-card, .url-card, .code-card, .formula-card, .media-card');

		cards.forEach((card) => {
			if (card.classList.contains('text-card')) {
				const text = card.dataset.text || card.querySelector('.text-card-body')?.innerText || '';
				if (text.trim()) blocks.push(`[[sn-text:${encodePayload({ text })}]]`);
				return;
			}

			if (card.classList.contains('url-card')) {
				const url = (card.dataset.url || card.querySelector('.url-card-body a')?.getAttribute('href') || card.querySelector('.url-card-body')?.innerText || '').trim();
				if (url) blocks.push(`[[sn-url:${encodePayload({ url })}]]`);
				return;
			}

			if (card.classList.contains('code-card')) {
				const code = card.dataset.code ?? card.querySelector('.code-card-body')?.innerText ?? '';
				const lang = card.dataset.lang || '';
				if (String(code).trim()) blocks.push(`[[sn-code:${encodePayload({ lang, code })}]]`);
				return;
			}

			if (card.classList.contains('formula-card')) {
				const formula = card.dataset.formula || card.querySelector('.formula-card-body')?.innerText || '';
				if (formula.trim()) blocks.push(`[[sn-formula:${encodePayload({ formula })}]]`);
				return;
			}

			if (card.classList.contains('media-card')) {
				const filename = (card.querySelector('.filename')?.textContent || card.querySelector('img')?.dataset?.filename || '').trim();
				if (filename) blocks.push(`![説明](image:${filename})`);
			}
		});

		return blocks.join('\n\n');
	};

	form.addEventListener('submit', () => {
		try {
			if (typeof window.syncHiddenField === 'function') {
				window.syncHiddenField();
				if ((bodyHidden.value || '').trim().length > 0) return;
			}
		} catch (_error) {
			// fallback serializer below
		}

		bodyHidden.value = serializeEditorCards();
	});

	form.dataset.bodyFallbackBound = 'true';
};

document.addEventListener('turbolinks:load', restoreDisabledSubmitButtons);
document.addEventListener('turbo:load', restoreDisabledSubmitButtons);
window.addEventListener('pageshow', restoreDisabledSubmitButtons);
document.addEventListener('turbolinks:load', bindPostBodyFallbackSync);
document.addEventListener('turbo:load', bindPostBodyFallbackSync);
window.addEventListener('pageshow', bindPostBodyFallbackSync);
