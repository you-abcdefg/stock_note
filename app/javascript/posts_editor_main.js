import { ensureTextModal, ensureCodeModal, ensureFormulaModal, ensureMediaModal, ensureFormulaModalWithPreview } from './card_modal';
import { buildMediaCard, buildFormulaCard, buildUrlCard } from './card_builder';

// カードタイプ選択モーダル
function showCardTypeSelectModal(onSelect) {
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

// カード追加ボタン設置・カード追加ロジック
function insertAddCardButtons(bodyEditor) {
  // 既存の追加ボタンを全て削除
  bodyEditor.querySelectorAll('.card-add-btn-row').forEach(row => row.remove());
  // カードリスト取得
  const cards = Array.from(bodyEditor.querySelectorAll('.text-card, .code-card, .formula-card, .media-card, .url-card'));
  for (let i = 0; i <= cards.length; i++) {
    const addBtnRow = document.createElement('div');
    addBtnRow.className = 'card-add-btn-row';
    addBtnRow.style.textAlign = 'center';
    addBtnRow.style.margin = '12px 0';
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'btn btn-outline-success btn-sm card-add-btn';
    addBtn.textContent = 'カード追加';
    addBtn.addEventListener('click', function(e) {
      e.preventDefault();
      showCardTypeSelectModal(function(type) {
        let card;
        if (type === 'text') {
          card = document.createElement('div');
          card.className = 'text-card';
          card.contentEditable = 'false';
          card.innerHTML = `<div class=\"text-card-body\"></div>` + cardActionButtonsHTML();
        } else if (type === 'image') {
          card = buildMediaCard('');
          card.innerHTML += cardActionButtonsHTML();
        } else if (type === 'url') {
          card = buildUrlCard('');
          card.innerHTML += cardActionButtonsHTML();
        } else if (type === 'code') {
          card = document.createElement('div');
          card.className = 'code-card';
          card.contentEditable = 'false';
          card.innerHTML = `<pre class=\"code-card-body\"></pre>` + cardActionButtonsHTML();
        } else if (type === 'formula') {
          card = buildFormulaCard('');
          card.innerHTML += cardActionButtonsHTML();
        }
        if (card) {
          if (i < cards.length) {
            bodyEditor.insertBefore(card, cards[i]);
          } else {
            bodyEditor.appendChild(card);
          }
          insertAddCardButtons(bodyEditor);
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
    <button class=\"card-move-up-btn\" type=\"button\" contenteditable=\"false\" style=\"position: absolute; top: 0; right: 110px; background: #6c757d; color: white; border: none; padding: 2px 6px; border-radius: 2px; font-size: 10px; cursor: pointer;\">↑</button>
    <button class=\"card-move-down-btn\" type=\"button\" contenteditable=\"false\" style=\"position: absolute; top: 0; right: 74px; background: #6c757d; color: white; border: none; padding: 2px 6px; border-radius: 2px; font-size: 10px; cursor: pointer;\">↓</button>
    <button class=\"card-edit-btn\" type=\"button\" contenteditable=\"false\" style=\"position: absolute; top: 0; right: 38px; background: #0d6efd; color: white; border: none; padding: 2px 6px; border-radius: 2px; font-size: 10px; cursor: pointer;\">編集</button>
    <button class=\"card-delete-btn\" type=\"button\" contenteditable=\"false\" style=\"position: absolute; top: 0; right: 2px; background: #dc3545; color: white; border: none; padding: 2px 6px; border-radius: 2px; font-size: 10px; cursor: pointer;\">削除</button>
  `;
}

// 初期化
function initContentEditableEditor() {
  const bodyEditor = document.getElementById('body-editor');
  if (!bodyEditor) return;
  insertAddCardButtons(bodyEditor);
}

document.addEventListener('DOMContentLoaded', initContentEditableEditor);
document.addEventListener('turbolinks:load', initContentEditableEditor);