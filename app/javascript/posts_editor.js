// ========== contenteditable 本文エディタの初期化 ==========

// 本文エディタのカード化・同期・ボタン操作をまとめて初期化する
document.addEventListener('DOMContentLoaded', initContentEditableEditor);
document.addEventListener('turbolinks:load', initContentEditableEditor);

function initContentEditableEditor() {
  const bodyEditor = document.getElementById('body-editor');
  const bodyHidden = document.getElementById('body-hidden');
  
  if (!bodyEditor || bodyEditor.dataset.initialized === 'true') return;
  bodyEditor.dataset.initialized = 'true';

  const insertImageButton = document.getElementById('insert-image-button');
  const insertCodeButton = document.getElementById('insert-code-button');
  const imageInput = document.getElementById('post_images');

  const allFiles = [];
  const localImageUrlMap = window.localImageUrlMap || new Map();
  window.localImageUrlMap = localImageUrlMap;

  // HTML特殊文字をエスケープ
  const escapeHtml = (text) => {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  };

    const parseFence = (text) => {
      const match = text.match(/^```([^\n]*)\n([\s\S]*?)\n```$/);
      return {
        lang: match ? match[1].trim() : '',
        code: match ? match[2] : text
      };
    };

    const getCodePreview = (code) => {
      const plain = (code || '').replace(/\s+/g, ' ').trim();
      return plain.slice(0, 10);
    };

    const ensureCodeModal = () => {
      if (document.getElementById('code-editor-overlay')) {
        return {
          overlay: document.getElementById('code-editor-overlay'),
          textarea: document.getElementById('code-editor-textarea'),
          saveBtn: document.getElementById('code-editor-save'),
          cancelBtn: document.getElementById('code-editor-cancel')
        };
      }

      const overlay = document.createElement('div');
      overlay.id = 'code-editor-overlay';
      overlay.className = 'code-editor-overlay';
      overlay.innerHTML = `
        <div class="code-editor-modal">
          <div class="code-editor-header">
            <span>コードを編集</span>
          </div>
          <textarea id="code-editor-textarea" class="code-editor-textarea"></textarea>
          <div class="code-editor-actions">
            <button type="button" id="code-editor-cancel" class="btn btn-sm btn-outline-secondary">キャンセル</button>
            <button type="button" id="code-editor-save" class="btn btn-sm btn-primary">保存</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);

      const textarea = overlay.querySelector('#code-editor-textarea');
      const saveBtn = overlay.querySelector('#code-editor-save');
      const cancelBtn = overlay.querySelector('#code-editor-cancel');

      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.remove('is-open');
        }
      });

      return { overlay, textarea, saveBtn, cancelBtn };
    };

  const buildCodeCard = (rawCode) => {
    const card = document.createElement('div');
    card.className = 'code-card';
    card.contentEditable = 'false';
    const parsed = parseFence(rawCode);
    card.dataset.lang = parsed.lang;
    card.dataset.code = parsed.code;
    const preview = getCodePreview(parsed.code);
    card.innerHTML = `
      <pre class="code-card-body">${escapeHtml(preview)}</pre>
      <button class="card-edit-btn" type="button" contenteditable="false" style="position: absolute; top: 2px; right: 38px; background: #0d6efd; color: white; border: none; padding: 2px 6px; border-radius: 2px; font-size: 10px; cursor: pointer;">編集</button>
      <button class="card-delete-btn" type="button" contenteditable="false" style="position: absolute; top: 2px; right: 2px; background: #dc3545; color: white; border: none; padding: 2px 6px; border-radius: 2px; font-size: 9px; cursor: pointer;">削除</button>
    `;

    const editBtn = card.querySelector('.card-edit-btn');
    editBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const modal = ensureCodeModal();
      const currentCode = card.dataset.code || '';
      modal.textarea.value = currentCode;
      modal.overlay.classList.add('is-open');
      modal.textarea.focus();

      const onSave = () => {
        card.dataset.code = modal.textarea.value;
        const pre = card.querySelector('pre');
        if (pre) pre.textContent = getCodePreview(modal.textarea.value);
        modal.overlay.classList.remove('is-open');
        syncHiddenField();
        modal.saveBtn.removeEventListener('click', onSave);
        modal.cancelBtn.removeEventListener('click', onCancel);
      };
      const onCancel = () => {
        modal.overlay.classList.remove('is-open');
        modal.saveBtn.removeEventListener('click', onSave);
        modal.cancelBtn.removeEventListener('click', onCancel);
      };

      modal.saveBtn.addEventListener('click', onSave);
      modal.cancelBtn.addEventListener('click', onCancel);
    });

    card.querySelector('.card-delete-btn').addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      card.remove();
      syncHiddenField();
    });

    return card;
  };

  // ========== マークダウン記法をリアルタイムでカード化 ==========
  const processEditorContent = () => {
    // contenteditableが生成する改行要素をテキストに統合
    Array.from(bodyEditor.childNodes).forEach((node) => {
      if (node.nodeType === 1 && !node.classList?.contains('media-card') && !node.classList?.contains('code-card')) {
        if (node.tagName === 'PRE') {
          const preText = node.textContent || '';
          const raw = `\n\n\u0060\u0060\u0060\n${preText}\n\u0060\u0060\u0060\n`;
          const codeCard = buildCodeCard(raw);
          node.parentNode.replaceChild(codeCard, node);
        } else if (node.tagName === 'BR') {
          node.parentNode.replaceChild(document.createTextNode('\n'), node);
        } else if (node.tagName === 'DIV' || node.tagName === 'P') {
          const text = node.textContent || '';
          const replacement = document.createTextNode(text + '\n');
          node.parentNode.replaceChild(replacement, node);
        }
      }
    });

    bodyEditor.normalize();

    const childNodes = Array.from(bodyEditor.childNodes);
    const combinedRegex = /(!\[([^\]]*)\]\(image:([^\)]+)\))|(```[\s\S]*?```)/g;

    const replaceBufferedNodes = (bufferNodes, bufferText) => {
      if (!bufferNodes.length) return;
      combinedRegex.lastIndex = 0;
      if (!combinedRegex.test(bufferText)) return;

      combinedRegex.lastIndex = 0;
      const fragment = document.createDocumentFragment();
      let lastIndex = 0;
      let match;

      while ((match = combinedRegex.exec(bufferText))) {
        if (match.index > lastIndex) {
          fragment.appendChild(
            document.createTextNode(bufferText.substring(lastIndex, match.index))
          );
        }

        if (match[1]) {
          const alt = match[2];
          const filename = match[3];
          const spacer = document.createElement('span');
          spacer.className = 'card-spacer';
          spacer.contentEditable = 'false';

          const card = document.createElement('div');
          card.className = 'media-card';
          card.contentEditable = 'false';
          card.innerHTML = `
            <img src="/images/placeholder.png" alt="${alt || '画像'}" data-filename="${filename}" loading="lazy">
            <div class="filename">${filename}</div>
            <button class="card-delete-btn" type="button">削除</button>
          `;

          const img = card.querySelector('img');
          if (localImageUrlMap.has(filename)) {
            img.src = localImageUrlMap.get(filename);
          } else if (window.imageUrlMap && window.imageUrlMap[filename]) {
            img.src = window.imageUrlMap[filename];
          } else {
            fetch(`/posts/image_url?filename=${encodeURIComponent(filename)}`)
              .then((response) => response.json())
              .then((data) => {
                if (data.url) img.src = data.url;
              })
              .catch(() => {});
          }

          card.querySelector('.card-delete-btn').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            card.remove();
            syncHiddenField();
          });

          fragment.appendChild(spacer);
          fragment.appendChild(card);
        } else if (match[4]) {
          const codeContent = match[4];
          fragment.appendChild(document.createTextNode('\u200b'));
          const card = buildCodeCard(codeContent);
          fragment.appendChild(card);
          fragment.appendChild(document.createTextNode('\u200b'));
        }

        lastIndex = combinedRegex.lastIndex;
      }

      if (lastIndex < bufferText.length) {
        fragment.appendChild(
          document.createTextNode(bufferText.substring(lastIndex))
        );
      }

      const first = bufferNodes[0];
      first.parentNode.replaceChild(fragment, first);
      bufferNodes.slice(1).forEach((n) => n.remove());
    };
    let bufferNodes = [];
    let bufferText = '';

    childNodes.forEach((node) => {
      if (node.classList?.contains('media-card') || node.classList?.contains('code-card')) {
        replaceBufferedNodes(bufferNodes, bufferText);
        bufferNodes = [];
        bufferText = '';
        return;
      }

      bufferNodes.push(node);

      if (node.nodeType === 3) {
        bufferText += (node.nodeValue || '').replace(/\u200b/g, '');
      } else if (node.nodeType === 1) {
        bufferText += node.textContent || '';
      }
    });

    replaceBufferedNodes(bufferNodes, bufferText);
  };

  const syncHiddenField = () => {
    let text = '';

    Array.from(bodyEditor.childNodes).forEach((node) => {
      if (node.nodeType === 3) {
        // テキストノード
        text += (node.nodeValue || '').replace(/\u200b/g, '');
      } else if (node.nodeType === 1) {
        // 要素ノード
        if (node.classList?.contains('card-spacer')) {
          return;
        }
        if (node.classList?.contains('media-card')) {
          const filename = node.querySelector('.filename')?.textContent || '';
          text += `![説明](image:${filename})`;
        } else if (node.classList?.contains('code-card')) {
          const pre = node.querySelector('pre');
          const lang = node.dataset?.lang || '';
          const codeText = node.dataset?.code ?? (pre ? pre.textContent : '');
          const fence = lang ? `\`\`\`${lang}` : '```';
          text += `\n${fence}\n${codeText}\n\`\`\`\n`;
        } else {
          // その他の要素（例：<br>、<p>など）
          text += node.textContent;
        }
      }
    });

    if (bodyHidden) {
      bodyHidden.value = text;
      bodyHidden.dispatchEvent(new Event('input'));
    }
  };

  const insertTextAtSelection = (text) => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    range.deleteContents();
    const textNode = document.createTextNode(text);
    range.insertNode(textNode);
    range.setStartAfter(textNode);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  };

  // ========== ページ初期ロード時にカード化を実行 ==========
  processEditorContent();
  syncHiddenField();

  // ========== イベントリスナー登録 ==========
  bodyEditor.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      insertTextAtSelection('\n');
      processEditorContent();
      syncHiddenField();
    }
  });
  bodyEditor.addEventListener('input', () => {
    processEditorContent();
    syncHiddenField();
    console.log('Body value:', bodyHidden.value);
  });

  bodyEditor.addEventListener('paste', (e) => {
    setTimeout(() => {
      processEditorContent();
      syncHiddenField();
      console.log('Paste - Body value:', bodyHidden.value);
    }, 0);
  });

  bodyEditor.addEventListener('blur', () => {
    syncHiddenField();
    console.log('Blur - Body value:', bodyHidden.value);
  });

  // 画像挿入
  if (insertImageButton) {
    insertImageButton.addEventListener('click', () => {
      imageInput?.click();
    });
  }

  if (imageInput) {
    imageInput.addEventListener('change', () => {
      if (!imageInput.files || imageInput.files.length === 0) return;

      const newFiles = Array.from(imageInput.files);
      newFiles.forEach((file) => {
        if (!localImageUrlMap.has(file.name)) {
          localImageUrlMap.set(file.name, URL.createObjectURL(file));
        }
        if (!allFiles.find((f) => f.name === file.name && f.size === file.size)) {
          allFiles.push(file);
        }
      });

      const dt = new DataTransfer();
      allFiles.forEach((file) => dt.items.add(file));
      imageInput.files = dt.files;

      // contenteditable divに挿入
      const sel = window.getSelection();
      if (sel.rangeCount === 0) {
        const range = document.createRange();
        range.selectNodeContents(bodyEditor);
        range.collapse(false);
        sel.addRange(range);
      }

      const lines = newFiles.map((file) => `![説明](image:${file.name})`);
      const text = lines.join('\n');
      
      const range = sel.getRangeAt(0);
      const textNode = document.createTextNode(text);
      range.insertNode(textNode);
      range.setStartAfter(textNode);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);

      bodyEditor.focus();
      processEditorContent();
      syncHiddenField();
    });
  }

  // コード挿入
  if (insertCodeButton) {
    insertCodeButton.addEventListener('click', (e) => {
      e.preventDefault();
      
      const sel = window.getSelection();
      if (sel.rangeCount === 0) {
        const range = document.createRange();
        range.selectNodeContents(bodyEditor);
        range.collapse(false);
        sel.addRange(range);
      }

      const range = sel.getRangeAt(0);
      const template = '\n```ruby\n\n```\n';
      const textNode = document.createTextNode(template);
      range.insertNode(textNode);
      
      // カーソルをコードブロック内に移動
      const newRange = document.createRange();
      newRange.setStart(textNode, 10); // ```ruby\n の次
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);

      bodyEditor.focus();
      
      setTimeout(() => {
        processEditorContent();
        syncHiddenField();
        const lastCodeCard = bodyEditor.querySelector('.code-card:last-of-type');
        if (lastCodeCard) {
          const modal = ensureCodeModal();
          modal.textarea.value = lastCodeCard.dataset.code || '';
          modal.overlay.classList.add('is-open');
          modal.textarea.focus();

          const onSave = () => {
            lastCodeCard.dataset.code = modal.textarea.value;
            const pre = lastCodeCard.querySelector('pre');
            if (pre) pre.textContent = modal.textarea.value;
            modal.overlay.classList.remove('is-open');
            syncHiddenField();
            modal.saveBtn.removeEventListener('click', onSave);
            modal.cancelBtn.removeEventListener('click', onCancel);
          };
          const onCancel = () => {
            modal.overlay.classList.remove('is-open');
            modal.saveBtn.removeEventListener('click', onSave);
            modal.cancelBtn.removeEventListener('click', onCancel);
          };

          modal.saveBtn.addEventListener('click', onSave);
          modal.cancelBtn.addEventListener('click', onCancel);
        }
      }, 10);
    });
  }

  // フォーム送信時に同期
  const form = bodyEditor.closest('form');
  if (form) {
    form.addEventListener('submit', () => {
      syncHiddenField();
    });
  }

  processEditorContent();
  syncHiddenField();
}
