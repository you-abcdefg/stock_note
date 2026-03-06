// ========== contenteditable 本文エディタの初期化 ==========

// 本文エディタのカード化・同期・ボタン操作をまとめて初期化する
document.addEventListener('DOMContentLoaded', initContentEditableEditor);
document.addEventListener('turbolinks:load', initContentEditableEditor);

function initContentEditableEditor() {
  const bodyEditor = document.getElementById('body-editor');
  const bodyHidden = document.getElementById('body-hidden');
  const bodySource = document.getElementById('body-source');
  const isPreviewOnly = bodyEditor?.dataset.previewOnly === 'true';
  
  if (!bodyEditor || bodyEditor.dataset.initialized === 'true') return;
  bodyEditor.dataset.initialized = 'true';

  const insertImageButton = document.getElementById('insert-image-button');
  const insertCodeButton = document.getElementById('insert-code-button');
  const insertFormulaButton = document.getElementById('insert-formula-button');
  const insertTextButton = document.getElementById('insert-text-button');
  const insertUrlButton = document.getElementById('insert-url-button');
  const openPreviewButton = document.getElementById('open-preview-modal-button');
  const imageInput = document.getElementById('post_images');

  const allFiles = [];
  const localImageUrlMap = window.localImageUrlMap || new Map();
  window.localImageUrlMap = localImageUrlMap;
  let isUpdatingInputFiles = false; // changeイベントの再帰防止フラグ
  
  // ● コード・数式カードを構造化トークン形式で保存するための定数と正規表現をまとめて定義
  const CODE_TOKEN_PREFIX = '[[sn-code:';
  // CODE_TOKEN_PREFIX: コードカード用の保存形式プリフィックス（Base64 JSONをwrapする）
  const FORMULA_TOKEN_PREFIX = '[[sn-formula:';
  const TEXT_TOKEN_PREFIX = '[[sn-text:';
  const URL_TOKEN_PREFIX = '[[sn-url:';
  // FORMULA_TOKEN_PREFIX: 数式カード用の保存形式プリフィックス（Base64 JSONをwrapする）
  const CODE_TOKEN_REGEX = /\[\[sn-code:([A-Za-z0-9+\/=]+)\]\]/;
  // CODE_TOKEN_REGEX: コードカードトークンの中身を抽出するパターン
  const FORMULA_TOKEN_REGEX = /\[\[sn-formula:([A-Za-z0-9+\/=]+)\]\]/;
  const TEXT_TOKEN_REGEX = /\[\[sn-text:([A-Za-z0-9+\/=]+)\]\]/;
  const URL_TOKEN_REGEX = /\[\[sn-url:([A-Za-z0-9+\/=]+)\]\]/;
  // FORMULA_TOKEN_REGEX: 数式カードトークンの中身を抽出するパターン

  const isLockedCardNode = (node) => {
    if (!node) return false;
    const element = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
    return !!(element && element.closest('.code-card, .formula-card, .text-card, .url-card, .media-card'));
  };

  const resolveEditorRange = () => {
    const selection = window.getSelection();
    if (!selection) return null;

    if (selection.rangeCount > 0) {
      const anchorNode = selection.anchorNode;
      if (isLockedCardNode(anchorNode)) {
        return null;
      }

      if (anchorNode && bodyEditor.contains(anchorNode)) {
        return selection.getRangeAt(0);
      }
    }

    const fallbackRange = document.createRange();
    fallbackRange.selectNodeContents(bodyEditor);
    fallbackRange.collapse(false);
    selection.removeAllRanges();
    selection.addRange(fallbackRange);
    return fallbackRange;
  };

  const CARD_SELECTOR = '.media-card, .code-card, .formula-card, .text-card, .url-card';

  const isMovableCard = (node) => {
    return !!(node && node.nodeType === 1 && node.matches && node.matches(CARD_SELECTOR));
  };

  const getCardBundleNodes = (card) => {
    if (!isMovableCard(card)) return [];
    if (card.classList.contains('media-card')) {
      const spacer = card.previousSibling;
      if (spacer && spacer.nodeType === 1 && spacer.classList.contains('card-spacer')) {
        return [spacer, card];
      }
    }
    return [card];
  };

  const getInsertAnchorNode = (card) => {
    if (!isMovableCard(card)) return null;
    if (card.classList.contains('media-card')) {
      const spacer = card.previousSibling;
      if (spacer && spacer.nodeType === 1 && spacer.classList.contains('card-spacer')) {
        return spacer;
      }
    }
    return card;
  };

  const moveCardByDirection = (card, direction) => {
    if (!isMovableCard(card)) return;

    const bundleNodes = getCardBundleNodes(card);
    if (bundleNodes.length === 0) return;

    const fragment = document.createDocumentFragment();
    bundleNodes.forEach((node) => fragment.appendChild(node));

    if (direction === 'up') {
      let cursor = (getInsertAnchorNode(card) || card).previousSibling;
      while (cursor) {
        if (isMovableCard(cursor)) {
          const targetAnchor = getInsertAnchorNode(cursor) || cursor;
          bodyEditor.insertBefore(fragment, targetAnchor);
          syncHiddenField();
          return;
        }
        cursor = cursor.previousSibling;
      }
      bodyEditor.insertBefore(fragment, bodyEditor.firstChild);
      syncHiddenField();
      return;
    }

    if (direction === 'down') {
      let cursor = bundleNodes[bundleNodes.length - 1].nextSibling;
      while (cursor) {
        if (isMovableCard(cursor)) {
          const targetBundle = getCardBundleNodes(cursor);
          const afterTarget = targetBundle[targetBundle.length - 1].nextSibling;
          bodyEditor.insertBefore(fragment, afterTarget);
          syncHiddenField();
          return;
        }
        cursor = cursor.nextSibling;
      }
      bodyEditor.appendChild(fragment);
      syncHiddenField();
    }
  };

  const setCardMoveHandlers = (card) => {
    if (!isMovableCard(card)) return;

    const upButton = card.querySelector('.card-move-up-btn');
    const downButton = card.querySelector('.card-move-down-btn');

    if (upButton && upButton.dataset.initialized !== 'true') {
      upButton.dataset.initialized = 'true';
      upButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        moveCardByDirection(card, 'up');
      });
    }

    if (downButton && downButton.dataset.initialized !== 'true') {
      downButton.dataset.initialized = 'true';
      downButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        moveCardByDirection(card, 'down');
      });
    }
  };

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

    // ● 保存形式の暗号化・復号化を行うBase64エンコード関数
    const encodeBase64Utf8 = (value) => {
      // encodeBase64Utf8: JSON文字列をBase64でエンコードして保存形式に変換する
      const utf8 = encodeURIComponent(value).replace(/%([0-9A-F]{2})/g, (_, hex) => {
        // utf8: URLエンコード後の値をバイト列に変換
        // encodeURIComponent: 日本語などを%XX形式に変換（UTF-8互換性確保）
        // parseInt: %XX形式をcharCodeに変換
        return String.fromCharCode(parseInt(hex, 16));
      });
      return btoa(utf8);
      // btoa: バイト列をBase64文字列に変換して返す
    };

    const decodeBase64Utf8 = (value) => {
      // decodeBase64Utf8: Base64形式の保存データをJSON文字列に復号化する
      const binary = atob(value);
      // binary: Base64文字列をバイト列に戻す
      const escaped = Array.from(binary)
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join('');
      // escaped: バイト列を%XX形式に変換（decodeURIComponentで処理可能にする）
      return decodeURIComponent(escaped);
      // decodeURIComponent: %XX形式を元の文字列（日本語対応）に戻す
    };

    // ● トークン内に埋め込まれたJSON文字列を抽出してパース
    const decodeSerializedPayload = (tokenRegex, rawText) => {
      // decodeSerializedPayload: token正規表現と生テキストからBase64 JSONを復号化する
      const matched = (rawText || '').trim().match(tokenRegex);
      // matched: 正規表現にマッチしたトークン全体と、Base64部分をキャプチャ
      if (!matched) return null;
      // if: トークン形式が見つからなかった場合、nullを返す（旧形式互換性保持）
      try {
        return JSON.parse(decodeBase64Utf8(matched[1]));
        // matched[1]: 正規表現の第1グループ（Base64部分）を復号化してJSON化
      } catch (_error) {
        return null;
        // catch: JSON.parseがエラーの場合（破損データ対応）nullを返す
      }
    };

    // ● コードカードの言語・内容をJSON形式で暗号化して保存トークン化
    const serializeCodeCard = (lang, code) => {
      // serializeCodeCard: コード言語と内容をBase64 JSONトークンに変換して保存形式化
      const payload = encodeBase64Utf8(JSON.stringify({ lang: lang || '', code: code || '' }));
      // payload: {lang, code}をJSON化してBase64エンコード
      // lang、code: コードカードの属性を構造化データとして保存
      return `${CODE_TOKEN_PREFIX}${payload}]]`;
      // return: [[sn-code:Base64文字列]]形式で整形して返す（フェンス記号依存脱却）
    };

    const serializeFormulaCard = (formula) => {
      // serializeFormulaCard: 数式テキストをBase64 JSONトークンに変換して保存形式化
      const payload = encodeBase64Utf8(JSON.stringify({ formula: formula || '' }));
      // payload: {formula}をJSON化してBase64エンコード
      return `${FORMULA_TOKEN_PREFIX}${payload}]]`;
      // return: [[sn-formula:Base64文字列]]形式で整形して返す（バッククォート記号依存脱却）
    };

    const serializeTextCard = (text) => {
      const payload = encodeBase64Utf8(JSON.stringify({ text: text || '' }));
      return `${TEXT_TOKEN_PREFIX}${payload}]]`;
    };

    const serializeUrlCard = (url) => {
      const payload = encodeBase64Utf8(JSON.stringify({ url: url || '' }));
      return `${URL_TOKEN_PREFIX}${payload}]]`;
    };

    // ● 数式カードの保存形式を解釈して、新トークン形式・旧フェンス形式の両方に対応
    const parseFormulaContent = (rawFormula) => {
      // parseFormulaContent: 数式カードテキストから実際の数式文字列を抽出（新旧両形式対応）
      const tokenPayload = decodeSerializedPayload(FORMULA_TOKEN_REGEX, rawFormula);
      // tokenPayload: 新形式 [[sn-formula:...]] からJSON化された内容を取得
      if (tokenPayload && typeof tokenPayload.formula === 'string') {
        // if: 新形式トークンの解析に成功した場合、formula値を優先使用
        return tokenPayload.formula;
      }

      const match = (rawFormula || '').match(/``formula\s*\ntext:([\s\S]*?)\n``/);
      // match: 旧形式 ``formula\ntext:...\n`` をパターンマッチで取得
      if (match) {
        // if: 旧形式の解析に成功した場合、抽出したテキストを返す（後方互換性保持）
        return match[1].trim();
      }

      // else: 両形式の解析に失敗した場合、フェンスを削除したrawテキストをそのまま返す
      return (rawFormula || '')
        .replace(/``formula\s*\n?/g, '')
        .replace(/\n?``\s*$/g, '')
        .trim();
    };

    const parseTextContent = (rawText) => {
      const tokenPayload = decodeSerializedPayload(TEXT_TOKEN_REGEX, rawText);
      if (tokenPayload && typeof tokenPayload.text === 'string') {
        return tokenPayload.text;
      }
      return (rawText || '').trim();
    };

    const parseUrlContent = (rawText) => {
      const tokenPayload = decodeSerializedPayload(URL_TOKEN_REGEX, rawText);
      if (tokenPayload && typeof tokenPayload.url === 'string') {
        return tokenPayload.url;
      }
      return (rawText || '').trim();
    };

    const parseFence = (text) => {
      const match = text.match(/^```([^\n]*)\n([\s\S]*?)\n```$/);
      return {
        lang: match ? match[1].trim() : '',
        code: match ? match[2] : text
      };
    };

    // ● コードカードの保存形式を解釈して、新トークン形式・旧フェンス形式の両方に対応
    const parseCodeContent = (rawCode) => {
      // parseCodeContent: コードカードテキストから言語と本体を抽出（新旧両形式対応）
      const tokenPayload = decodeSerializedPayload(CODE_TOKEN_REGEX, rawCode);
      // tokenPayload: 新形式 [[sn-code:...]] からJSON化された内容を取得
      if (tokenPayload && typeof tokenPayload.code === 'string') {
        // if: 新形式トークンの解析に成功した場合、lang・code値をオブジェクトで返す
        return {
          lang: typeof tokenPayload.lang === 'string' ? tokenPayload.lang : '',
          // lang: コード言語指定（存在しない場合は空文字）
          code: tokenPayload.code
          // code: コード本体
        };
      }
      return parseFence(rawCode);
      // else: 旧形式 ```lang...``` をparseFenceで解析（後方互換性保持）
    };

    const getCodePreview = (code) => {
      const plain = (code || '').replace(/\s+/g, ' ').trim();
      return plain.slice(0, 10);
    };

    const ensureFormulaModal = () => {
      if (document.getElementById('formula-editor-overlay')) {
        return {
          overlay: document.getElementById('formula-editor-overlay'),
          textarea: document.getElementById('formula-editor-textarea'),
          saveBtn: document.getElementById('formula-save'),
          cancelBtn: document.getElementById('formula-cancel')
        };
      }

      const overlay = document.createElement('div');
      overlay.id = 'formula-editor-overlay';
      overlay.className = 'formula-editor-overlay';
      overlay.innerHTML = `
        <div class="formula-editor-modal">
          <div class="formula-editor-content">
            <div class="formula-editor-topbar" style="display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 8px; padding-bottom: 10px; border-bottom: 1px solid #ddd;">
              <div class="formula-editor-header" style="font-weight: 500;">
                <span>数式を挿入</span>
              </div>
              <div class="formula-editor-actions" style="display: flex; gap: 8px;">
                <button type="button" id="formula-cancel" class="btn btn-sm btn-outline-secondary">キャンセル</button>
                <button type="button" id="formula-save" class="btn btn-sm btn-primary">保存</button>
              </div>
            </div>
            <textarea id="formula-editor-textarea" class="formula-editor-textarea" placeholder="例: a^2 + b^2 = c^2"></textarea>
            <div style="font-size: 12px; color: #666; margin-top: 12px; line-height: 1.6;">
              <strong>上付き・下付き文字の入力方法：</strong><br>
              • 右上付き文字: ^ を使用（表示: x² / 入力: x^2）<br>
              • 右下付き文字: _ を使用（表示: a₁ / 入力: a_1）<br>
              • 左添え字: [左上,左下]->基準文字（例: [1,0]->n → ¹₀n）<br>
              • 右添え字: 基準文字<-[右上,右下]（例: x<-[2,i] → x²ᵢ）<br>
              • 中央配置: 基準文字@[上,下]（例: Σ@[n,i=1] → Σⁿᵢ₌₁）<br>
              <br>
              <strong>入力例：</strong><br>
              • 核分裂反応式（左添え字）<br>
                表示: ²³⁵₉₂U + ¹₀n → ¹⁴¹₅₆Ba + ⁹²₃₆Kr + 3¹₀n　　入力: [235,92]->U + [1,0]->n → [141,56]->Ba + [92,36]->Kr + 3[1,0]->n<br>
              • カイ二乗統計量（中央配置）<br>
                表示: χ²ᵥ = Σⁿᵢ₌₁ Zᵢ²　/　入力: χ<-[2,ν] = Σ@[n,i=1] Z<-[2,i]<br>
              • 三平方の定理（基本例）<br>
                表示: a² + b² = c²　/　入力: a^2 + b^2 = c^2<br>
              <br>
              • <strong>終了規則：数字・文字の後ろに半角スペースまたは記号で終了</strong>
            </div>
          </div>
        </div>
      `;
      
      // モーダルの完全なスタイルをJavaScriptで定義
      const style = document.createElement('style');
      if (!document.querySelector('style[data-formula-modal]')) {
        style.setAttribute('data-formula-modal', 'true');
        style.textContent = `
          .formula-editor-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.4);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 9999;
          }
          .formula-editor-overlay.is-open {
            display: flex !important;
          }
          .formula-editor-modal {
            background: #fff;
            width: 90%;
            max-width: 1200px;
            border-radius: 8px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            display: flex;
            flex-direction: column;
            padding: 24px;
          }
          .formula-editor-textarea {
            width: 100%;
            min-height: 120px;
            padding: 12px;
            font-family: "Monaco", "Menlo", "Ubuntu Mono", "Courier New", monospace;
            font-size: 14px;
            border: 1px solid #ccc;
            border-radius: 4px;
            resize: vertical;
          }
          .formula-editor-textarea:focus {
            outline: none;
            border-color: #0d6efd;
            box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.25);
          }
        `;
        document.head.appendChild(style);
      }
      
      document.body.appendChild(overlay);

      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.remove('is-open');
          overlay.style.display = 'none';
        }
      });

      return {
        overlay,
        textarea: overlay.querySelector('#formula-editor-textarea'),
        saveBtn: overlay.querySelector('#formula-save'),
        cancelBtn: overlay.querySelector('#formula-cancel')
      };
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
      
      // モーダルの完全なスタイルをJavaScriptで定義
      if (!document.querySelector('style[data-code-modal]')) {
        const style = document.createElement('style');
        style.setAttribute('data-code-modal', 'true');
        style.textContent = `
          .code-editor-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.4);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 9999;
          }
          .code-editor-overlay.is-open {
            display: flex !important;
          }
          .code-editor-modal {
            background: #fff;
            width: 90%;
            max-width: 1200px;
            height: min(70vh, 600px);
            border-radius: 8px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            display: flex;
            flex-direction: column;
            padding: 12px;
          }
          .code-editor-header {
            font-weight: 600;
            margin-bottom: 8px;
          }
          .code-editor-textarea {
            flex: 1;
            width: 100%;
            resize: none;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
            font-size: 13px;
            line-height: 1.5;
            border: 1px solid #dee2e6;
            border-radius: 6px;
            padding: 10px;
          }
          .code-editor-actions {
            margin-top: 10px;
            display: flex;
            justify-content: flex-end;
            gap: 8px;
          }
        `;
        document.head.appendChild(style);
      }
      
      document.body.appendChild(overlay);

      const textarea = overlay.querySelector('#code-editor-textarea');
      const saveBtn = overlay.querySelector('#code-editor-save');
      const cancelBtn = overlay.querySelector('#code-editor-cancel');

      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.remove('is-open');
          overlay.style.display = 'none';
        }
      });

      return { overlay, textarea, saveBtn, cancelBtn };
    };

    const ensureTextModal = () => {
      if (document.getElementById('text-editor-overlay')) {
        return {
          overlay: document.getElementById('text-editor-overlay'),
          textarea: document.getElementById('text-editor-textarea'),
          saveBtn: document.getElementById('text-editor-save'),
          cancelBtn: document.getElementById('text-editor-cancel')
        };
      }

      const overlay = document.createElement('div');
      overlay.id = 'text-editor-overlay';
      overlay.className = 'code-editor-overlay';
      overlay.innerHTML = `
        <div class="code-editor-modal">
          <div class="code-editor-header">
            <span>テキストを編集</span>
          </div>
          <textarea id="text-editor-textarea" class="code-editor-textarea"></textarea>
          <div class="code-editor-actions">
            <button type="button" id="text-editor-cancel" class="btn btn-sm btn-outline-secondary">キャンセル</button>
            <button type="button" id="text-editor-save" class="btn btn-sm btn-primary">保存</button>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.remove('is-open');
          overlay.style.display = 'none';
        }
      });

      return {
        overlay,
        textarea: overlay.querySelector('#text-editor-textarea'),
        saveBtn: overlay.querySelector('#text-editor-save'),
        cancelBtn: overlay.querySelector('#text-editor-cancel')
      };
    };

    const ensurePreviewModal = () => {
      if (document.getElementById('post-preview-overlay')) {
        return {
          overlay: document.getElementById('post-preview-overlay'),
          body: document.getElementById('post-preview-body'),
          closeBtn: document.getElementById('post-preview-close')
        };
      }

      const overlay = document.createElement('div');
      overlay.id = 'post-preview-overlay';
      overlay.className = 'code-editor-overlay';
      overlay.innerHTML = `
        <div class="code-editor-modal" style="max-width: 1000px; height: min(80vh, 700px);">
          <div class="code-editor-header" style="display:flex; justify-content:space-between; align-items:center;">
            <span>投稿全体プレビュー</span>
            <button type="button" id="post-preview-close" class="btn btn-sm btn-outline-secondary">閉じる</button>
          </div>
          <div id="post-preview-body" style="flex:1; overflow:auto; border:1px solid #dee2e6; border-radius:6px; padding:12px; background:#fff;"></div>
        </div>
      `;

      document.body.appendChild(overlay);
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.remove('is-open');
          overlay.style.display = 'none';
        }
      });

      return {
        overlay,
        body: overlay.querySelector('#post-preview-body'),
        closeBtn: overlay.querySelector('#post-preview-close')
      };
    };

  const buildTextCard = (rawText) => {
    const card = document.createElement('div');
    card.className = 'text-card';
    card.contentEditable = 'false';
    const content = parseTextContent(rawText);
    card.dataset.text = content;
    card.innerHTML = `<div class="text-card-body">${escapeHtml(content).replace(/\n/g, '<br>')}</div><button class="card-move-up-btn" type="button" contenteditable="false" style="position: absolute; top: 0; right: 110px; background: #6c757d; color: white; border: none; padding: 2px 6px; border-radius: 2px; font-size: 10px; cursor: pointer;">上へ</button><button class="card-move-down-btn" type="button" contenteditable="false" style="position: absolute; top: 0; right: 74px; background: #6c757d; color: white; border: none; padding: 2px 6px; border-radius: 2px; font-size: 10px; cursor: pointer;">下へ</button><button class="card-edit-btn" type="button" contenteditable="false" style="position: absolute; top: 0; right: 38px; background: #0d6efd; color: white; border: none; padding: 2px 6px; border-radius: 2px; font-size: 10px; cursor: pointer;">編集</button><button class="card-delete-btn" type="button" contenteditable="false" style="position: absolute; top: 0; right: 2px; background: #dc3545; color: white; border: none; padding: 2px 6px; border-radius: 2px; font-size: 9px; cursor: pointer;">削除</button>`;

    card.querySelector('.card-edit-btn').addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const modal = ensureTextModal();
      modal.textarea.value = card.dataset.text || '';
      modal.overlay.style.display = 'flex';
      modal.overlay.classList.add('is-open');
      modal.textarea.focus();

      const onSave = () => {
        card.dataset.text = modal.textarea.value;
        const body = card.querySelector('.text-card-body');
        if (body) body.innerHTML = escapeHtml(modal.textarea.value).replace(/\n/g, '<br>');
        modal.overlay.classList.remove('is-open');
        modal.overlay.style.display = 'none';
        modal.saveBtn.removeEventListener('click', onSave);
        modal.cancelBtn.removeEventListener('click', onCancel);
        syncHiddenField();
      };
      const onCancel = () => {
        modal.overlay.classList.remove('is-open');
        modal.overlay.style.display = 'none';
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

    setCardMoveHandlers(card);
    return card;
  };

  const buildUrlCard = (rawUrl) => {
    const card = document.createElement('div');
    card.className = 'url-card';
    card.contentEditable = 'false';
    const url = parseUrlContent(rawUrl);
    card.dataset.url = url;
    card.innerHTML = `<pre class="url-card-body">${escapeHtml(url)}</pre><button class="card-move-up-btn" type="button" contenteditable="false" style="position: absolute; top: 0; right: 110px; background: #6c757d; color: white; border: none; padding: 2px 6px; border-radius: 2px; font-size: 10px; cursor: pointer;">上へ</button><button class="card-move-down-btn" type="button" contenteditable="false" style="position: absolute; top: 0; right: 74px; background: #6c757d; color: white; border: none; padding: 2px 6px; border-radius: 2px; font-size: 10px; cursor: pointer;">下へ</button><button class="card-edit-btn" type="button" contenteditable="false" style="position: absolute; top: 0; right: 38px; background: #0d6efd; color: white; border: none; padding: 2px 6px; border-radius: 2px; font-size: 10px; cursor: pointer;">編集</button><button class="card-delete-btn" type="button" contenteditable="false" style="position: absolute; top: 0; right: 2px; background: #dc3545; color: white; border: none; padding: 2px 6px; border-radius: 2px; font-size: 9px; cursor: pointer;">削除</button>`;

    card.querySelector('.card-edit-btn').addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const modal = ensureTextModal();
      modal.textarea.value = card.dataset.url || '';
      modal.overlay.style.display = 'flex';
      modal.overlay.classList.add('is-open');
      modal.textarea.focus();

      const onSave = () => {
        const nextUrl = modal.textarea.value.trim();
        card.dataset.url = nextUrl;
        const body = card.querySelector('.url-card-body');
        if (body) {
          body.textContent = nextUrl;
        }
        modal.overlay.classList.remove('is-open');
        modal.overlay.style.display = 'none';
        modal.saveBtn.removeEventListener('click', onSave);
        modal.cancelBtn.removeEventListener('click', onCancel);
        syncHiddenField();
      };
      const onCancel = () => {
        modal.overlay.classList.remove('is-open');
        modal.overlay.style.display = 'none';
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

    setCardMoveHandlers(card);
    return card;
  };

  const buildFormulaCard = (rawFormula) => {
    const card = document.createElement('div');
    card.className = 'formula-card';
    card.contentEditable = 'false';
    const formulaText = parseFormulaContent(rawFormula);
    
    card.dataset.formula = formulaText;
    
    card.innerHTML = `<div class="formula-card-body">${escapeHtml(formulaText)}</div><button class="card-move-up-btn" type="button" contenteditable="false" style="position: absolute; top: 0; right: 110px; background: #6c757d; color: white; border: none; padding: 2px 6px; border-radius: 2px; font-size: 10px; cursor: pointer; z-index: 10;">上へ</button><button class="card-move-down-btn" type="button" contenteditable="false" style="position: absolute; top: 0; right: 74px; background: #6c757d; color: white; border: none; padding: 2px 6px; border-radius: 2px; font-size: 10px; cursor: pointer; z-index: 10;">下へ</button><button class="card-edit-btn" type="button" contenteditable="false" style="position: absolute; top: 0; right: 38px; background: #0d6efd; color: white; border: none; padding: 2px 6px; border-radius: 2px; font-size: 10px; cursor: pointer; z-index: 10;">編集</button><button class="card-delete-btn" type="button" contenteditable="false" style="position: absolute; top: 0; right: 2px; background: #dc3545; color: white; border: none; padding: 2px 6px; border-radius: 2px; font-size: 9px; cursor: pointer; z-index: 10;">削除</button>`;

    const editBtn = card.querySelector('.card-edit-btn');
    editBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const modal = ensureFormulaModal();
      modal.textarea.value = card.dataset.formula || '';
      if (modal.overlay) {
        modal.overlay.style.display = 'flex';
        modal.overlay.classList.add('is-open');
      }
      modal.textarea.focus();

      const oldSaveBtn = modal.saveBtn.cloneNode(true);
      const oldCancelBtn = modal.cancelBtn.cloneNode(true);
      modal.saveBtn.parentNode.replaceChild(oldSaveBtn, modal.saveBtn);
      modal.cancelBtn.parentNode.replaceChild(oldCancelBtn, modal.cancelBtn);
      const newModal = { ...modal, saveBtn: oldSaveBtn, cancelBtn: oldCancelBtn };

      const onSave = () => {
        card.dataset.formula = newModal.textarea.value;
        const body = card.querySelector('.formula-card-body');
        if (body) body.textContent = newModal.textarea.value;
        if (newModal.overlay) {
          newModal.overlay.classList.remove('is-open');
          newModal.overlay.style.display = 'none';
        }
        syncHiddenField();
      };
      const onCancel = () => {
        if (newModal.overlay) {
          newModal.overlay.classList.remove('is-open');
          newModal.overlay.style.display = 'none';
        }
      };

      newModal.saveBtn.addEventListener('click', onSave);
      newModal.cancelBtn.addEventListener('click', onCancel);
    });

    card.querySelector('.card-delete-btn').addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      card.remove();
      syncHiddenField();
    });

    setCardMoveHandlers(card);

    return card;
  };

  const buildCodeCard = (rawCode) => {
    const card = document.createElement('div');
    card.className = 'code-card';
    card.contentEditable = 'false';
    const parsed = parseCodeContent(rawCode);
    card.dataset.lang = parsed.lang;
    card.dataset.code = parsed.code;
    const preview = getCodePreview(parsed.code);
    card.innerHTML = `<pre class="code-card-body">${escapeHtml(preview)}</pre><button class="card-move-up-btn" type="button" contenteditable="false" style="position: absolute; top: 0; right: 110px; background: #6c757d; color: white; border: none; padding: 2px 6px; border-radius: 2px; font-size: 10px; cursor: pointer;">上へ</button><button class="card-move-down-btn" type="button" contenteditable="false" style="position: absolute; top: 0; right: 74px; background: #6c757d; color: white; border: none; padding: 2px 6px; border-radius: 2px; font-size: 10px; cursor: pointer;">下へ</button><button class="card-edit-btn" type="button" contenteditable="false" style="position: absolute; top: 0; right: 38px; background: #0d6efd; color: white; border: none; padding: 2px 6px; border-radius: 2px; font-size: 10px; cursor: pointer;">編集</button><button class="card-delete-btn" type="button" contenteditable="false" style="position: absolute; top: 0; right: 2px; background: #dc3545; color: white; border: none; padding: 2px 6px; border-radius: 2px; font-size: 9px; cursor: pointer;">削除</button>`;

    const editBtn = card.querySelector('.card-edit-btn');
    editBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const modal = ensureCodeModal();
      const currentCode = card.dataset.code || '';
      modal.textarea.value = currentCode;
      if (modal.overlay) {
        modal.overlay.style.display = 'flex';
        modal.overlay.classList.add('is-open');
      }
      modal.textarea.focus();

      const onSave = () => {
        card.dataset.code = modal.textarea.value;
        const pre = card.querySelector('pre');
        if (pre) pre.textContent = modal.textarea.value;
        if (modal.overlay) {
          modal.overlay.classList.remove('is-open');
          modal.overlay.style.display = 'none';
        }
        syncHiddenField();
        if (modal.saveBtn) modal.saveBtn.removeEventListener('click', onSave);
        if (modal.cancelBtn) modal.cancelBtn.removeEventListener('click', onCancel);
      };
      const onCancel = () => {
        if (modal.overlay) {
          modal.overlay.classList.remove('is-open');
          modal.overlay.style.display = 'none';
        }
        if (modal.saveBtn) modal.saveBtn.removeEventListener('click', onSave);
        if (modal.cancelBtn) modal.cancelBtn.removeEventListener('click', onCancel);
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

    setCardMoveHandlers(card);

    return card;
  };

  // ========== マークダウン記法をリアルタイムでカード化 ==========
  const processEditorContent = () => {
    // 手順0：既存のBR や 無関係な DIV/P をtext-lineでラップ
    const wrapLooseContent = () => {
      Array.from(bodyEditor.childNodes).forEach((node) => {
        if (node.nodeType === 1) { // Element node
          if (node.tagName === 'BR') {
            // <br> を text-line でラップ
            const textLine = document.createElement('div');
            textLine.className = 'text-line';
            textLine.contentEditable = 'true';
            textLine.appendChild(document.createTextNode('\u200b'));
            node.replaceWith(textLine);
          } else if ((node.tagName === 'DIV' || node.tagName === 'P') && 
                     !node.classList?.contains('text-line') &&
                     !node.classList?.contains('media-card') && 
                     !node.classList?.contains('code-card') &&
                     !node.classList?.contains('formula-card')) {
            // 無関係な DIV/P を text-line に変換（内容を保持）
            const textLine = document.createElement('div');
            textLine.className = 'text-line';
            textLine.contentEditable = 'true';
            while (node.firstChild) {
              textLine.appendChild(node.firstChild);
            }
            if (textLine.childNodes.length === 0) {
              textLine.appendChild(document.createTextNode('\u200b'));
            }
            node.replaceWith(textLine);
          } else if (node.tagName === 'PRE') {
            const preText = node.textContent || '';
            const raw = `\n\n\u0060\u0060\u0060\n${preText}\n\u0060\u0060\u0060\n`;
            const codeCard = buildCodeCard(raw);
            node.parentNode.replaceChild(codeCard, node);
          }
        } else if (node.nodeType === 3) { // Text node
          // 手前のノードと後ろのノードを見て、テキストノードを text-line でラップするか判定
          if (node.data.trim() !== '') {
            const textLine = document.createElement('div');
            textLine.className = 'text-line';
            textLine.contentEditable = 'true';
            textLine.appendChild(document.createTextNode(node.data));
            node.replaceWith(textLine);
          }
        }
      });
    };
    wrapLooseContent();

    bodyEditor.normalize();

    const childNodes = Array.from(bodyEditor.childNodes);
    
    const combinedRegex = /(!\[([^\]]*)\]\(image:([^\)]+)\))|(```[\s\S]*?```)|(``formula[\s\S]*?``)|(\[\[sn-code:[A-Za-z0-9+\/=]+\]\])|(\[\[sn-formula:[A-Za-z0-9+\/=]+\]\])|(\[\[sn-text:[A-Za-z0-9+\/=]+\]\])|(\[\[sn-url:[A-Za-z0-9+\/=]+\]\])/g;

    const replaceBufferedNodes = (bufferNodes, bufferText) => {
      combinedRegex.lastIndex = 0;
      
      if (!bufferNodes.length) return;
      combinedRegex.lastIndex = 0;
      if (!combinedRegex.test(bufferText)) {
        const plainTextOnly = (bufferText || '').trim();
        if (!plainTextOnly) return;

        const fragment = document.createDocumentFragment();
        fragment.appendChild(document.createTextNode('\u200b'));
        fragment.appendChild(buildTextCard(serializeTextCard(plainTextOnly)));
        fragment.appendChild(document.createTextNode('\u200b'));

        const first = bufferNodes[0];
        first.parentNode.replaceChild(fragment, first);
        bufferNodes.slice(1).forEach((n) => n.remove());
        return;
      }
      combinedRegex.lastIndex = 0;
      const fragment = document.createDocumentFragment();
      let lastIndex = 0;
      let match;

      while ((match = combinedRegex.exec(bufferText))) {
        if (match.index > lastIndex) {
          const plainText = bufferText.substring(lastIndex, match.index).trim();
          if (plainText) {
            fragment.appendChild(document.createTextNode('\u200b'));
            fragment.appendChild(buildTextCard(serializeTextCard(plainText)));
            fragment.appendChild(document.createTextNode('\u200b'));
          }
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
            <button class="card-move-up-btn" type="button" contenteditable="false" style="position: absolute; top: 0; right: 74px; background: #6c757d; color: white; border: none; padding: 2px 6px; border-radius: 2px; font-size: 10px; cursor: pointer;">上へ</button>
            <button class="card-move-down-btn" type="button" contenteditable="false" style="position: absolute; top: 0; right: 38px; background: #6c757d; color: white; border: none; padding: 2px 6px; border-radius: 2px; font-size: 10px; cursor: pointer;">下へ</button>
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

          setCardMoveHandlers(card);

          fragment.appendChild(spacer);
          fragment.appendChild(card);
        } else if (match[4] || match[6]) {
          const codeContent = match[4] || match[6];
          fragment.appendChild(document.createTextNode('\u200b'));
          const card = buildCodeCard(codeContent);
          fragment.appendChild(card);
          fragment.appendChild(document.createTextNode('\u200b'));
        } else if (match[5] || match[7]) {
          const formulaContent = match[5] || match[7];
          fragment.appendChild(document.createTextNode('\u200b'));
          const card = buildFormulaCard(formulaContent);
          fragment.appendChild(card);
          fragment.appendChild(document.createTextNode('\u200b'));
        } else if (match[8]) {
          fragment.appendChild(document.createTextNode('\u200b'));
          fragment.appendChild(buildTextCard(match[8]));
          fragment.appendChild(document.createTextNode('\u200b'));
        } else if (match[9]) {
          fragment.appendChild(document.createTextNode('\u200b'));
          fragment.appendChild(buildUrlCard(match[9]));
          fragment.appendChild(document.createTextNode('\u200b'));
        }

        lastIndex = combinedRegex.lastIndex;
      }

      if (lastIndex < bufferText.length) {
        const plainText = bufferText.substring(lastIndex).trim();
        if (plainText) {
          fragment.appendChild(document.createTextNode('\u200b'));
          fragment.appendChild(buildTextCard(serializeTextCard(plainText)));
          fragment.appendChild(document.createTextNode('\u200b'));
        }
      }

      const first = bufferNodes[0];
      first.parentNode.replaceChild(fragment, first);
      bufferNodes.slice(1).forEach((n) => n.remove());
    };
    let bufferNodes = [];
    let bufferText = '';

    childNodes.forEach((node) => {
      if (node.classList?.contains('media-card') || node.classList?.contains('code-card') || node.classList?.contains('formula-card') || node.classList?.contains('text-card') || node.classList?.contains('url-card')) {
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

    const isCardNode = (node) => {
      return !!(node && node.nodeType === 1 && node.classList &&
        (node.classList.contains('media-card') ||
         node.classList.contains('code-card') ||
         node.classList.contains('formula-card') ||
         node.classList.contains('text-card') ||
         node.classList.contains('url-card')));
    };

    const appendBlock = (blockText) => {
      if (text && !text.endsWith('\n')) {
        text += '\n';
      }
      text += blockText;
      if (!text.endsWith('\n')) {
        text += '\n';
      }
    };

    Array.from(bodyEditor.childNodes).forEach((node) => {
      if (node.nodeType === 1) {
        // Element node
        if (node.classList?.contains('card-spacer')) {
          // card-spacer はスキップ
          return;
        } else if (node.classList?.contains('media-card')) {
          const filename = node.querySelector('.filename')?.textContent || '';
          appendBlock(`![説明](image:${filename})`);
        } else if (node.classList?.contains('text-card')) {
          const textCardText = node.dataset?.text || '';
          appendBlock(serializeTextCard(textCardText));
        } else if (node.classList?.contains('url-card')) {
          const url = node.dataset?.url || '';
          appendBlock(serializeUrlCard(url));
        } else if (node.classList?.contains('code-card')) {
          const pre = node.querySelector('pre');
          const lang = node.dataset?.lang || '';
          const codeText = node.dataset?.code ?? (pre ? pre.textContent : '');
          appendBlock(serializeCodeCard(lang, codeText));
        } else if (node.classList?.contains('formula-card')) {
          const formulaText = node.dataset?.formula || '';
          appendBlock(serializeFormulaCard(formulaText));
        } else if (node.tagName === 'BR') {
          text += '\n';
        }
      } else if (node.nodeType === 3) {
        // テキストノード（旧形式対応）
        const rawText = (node.nodeValue || '').replace(/\u200b/g, '');
        if (/^\s*$/.test(rawText) && (isCardNode(node.previousSibling) || isCardNode(node.nextSibling))) {
          return;
        }
        text += rawText;
      }
    });

    text = text
      .replace(/\n{2,}``formula/g, '\n``formula')
      .replace(/``\n{2,}/g, '``\n')
      .replace(/\n{3,}/g, '\n\n');

    if (bodyHidden) {
      bodyHidden.value = text;
      bodyHidden.dispatchEvent(new Event('input'));
    }

    if (bodySource && bodySource.value !== text) {
      bodySource.value = text;
    }
  };

  const renderEditorFromSource = (sourceText) => {
    bodyEditor.innerHTML = '';
    bodyEditor.appendChild(document.createTextNode(sourceText || ''));
    processEditorContent();
    bodyEditor.querySelectorAll(CARD_SELECTOR).forEach((card) => setCardMoveHandlers(card));
    syncHiddenField();
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

  const insertTextIntoSource = (text, cursorShift = 0) => {
    if (!bodySource) return;

    const value = bodySource.value || '';
    const hasSelection = typeof bodySource.selectionStart === 'number' && typeof bodySource.selectionEnd === 'number';
    const start = hasSelection ? bodySource.selectionStart : value.length;
    const end = hasSelection ? bodySource.selectionEnd : value.length;
    const nextValue = `${value.slice(0, start)}${text}${value.slice(end)}`;

    bodySource.value = nextValue;

    const caret = Math.max(start + text.length + cursorShift, 0);
    if (typeof bodySource.setSelectionRange === 'function') {
      bodySource.focus();
      bodySource.setSelectionRange(caret, caret);
    }

    renderEditorFromSource(nextValue);
  };

  // ========== ページ初期ロード時にカード化を実行 ==========
  const initialSourceText = bodySource
    ? bodySource.value
    : ((bodyHidden && bodyHidden.value) || bodyEditor.textContent || '');
  renderEditorFromSource(initialSourceText);

  // ========== イベントリスナー登録 ==========
  // Enter キーで改行を挿入
  bodyEditor.addEventListener('keydown', (e) => {
    if (isPreviewOnly) {
      e.preventDefault();
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      const sel = window.getSelection();
      if (sel.rangeCount === 0) return;
      
      const range = sel.getRangeAt(0);
      
      // 新しい<div class="text-line">を作成
      const newLine = document.createElement('div');
      newLine.className = 'text-line';
      newLine.contentEditable = 'true';
      
      // 現在のカーソル位置の後のコンテンツを新しい行に移動
      const tempContainer = document.createElement('div');
      const endRange = range.cloneRange();
      endRange.collapse(false);
      const fragment = endRange.extractContents();
      if (fragment.childNodes.length > 0) {
        newLine.appendChild(fragment);
      } else {
        const emptyMarker = document.createTextNode('\u200b');
        newLine.appendChild(emptyMarker);
      }
      
      // 新しい行をカーソル位置の後に挿入
      const insertAfter = (element, referenceNode) => {
        if (referenceNode.nextSibling) {
          referenceNode.parentNode.insertBefore(element, referenceNode.nextSibling);
        } else {
          referenceNode.parentNode.appendChild(element);
        }
      };
      
      let currentNode = range.startContainer;
      let parentLine = currentNode.nodeType === Node.TEXT_NODE ? currentNode.parentElement : currentNode;
      if (!parentLine.classList?.contains('text-line')) {
        parentLine = parentLine.closest('.text-line') || bodyEditor;
      }
      
      insertAfter(newLine, parentLine);
      
      // カーソルを新しい行の最初に設定
      const firstNodeInNew = newLine.firstChild || newLine;
      const newRange = document.createRange();
      if (firstNodeInNew.nodeType === Node.TEXT_NODE) {
        newRange.setStart(firstNodeInNew, 0);
      } else {
        newRange.selectNodeContents(firstNodeInNew);
        newRange.collapse(true);
      }
      sel.removeAllRanges();
      sel.addRange(newRange);
      
      syncHiddenField();
    }
  });

  bodyEditor.addEventListener('input', () => {
    if (isPreviewOnly) return;
    processEditorContent();
    bodyEditor.querySelectorAll(CARD_SELECTOR).forEach((card) => setCardMoveHandlers(card));
    syncHiddenField();
  });

  if (bodySource) {
    bodySource.addEventListener('input', () => {
      renderEditorFromSource(bodySource.value || '');
    });
  }

  bodyEditor.addEventListener('paste', (e) => {
    if (isPreviewOnly) {
      e.preventDefault();
      return;
    }

    // クリップボードから画像データを取得
    const items = e.clipboardData?.items;
    if (items) {
      let hasImage = false;
      const imagesToInsert = [];
      
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        // 画像データの場合
        if (item.type.indexOf('image') !== -1) {
          hasImage = true;
          e.preventDefault(); // デフォルトの貼り付けを防止
          
          const blob = item.getAsFile();
          if (blob) {
            // ファイル名を生成（タイムスタンプ付き）
            const timestamp = Date.now();
            const extension = blob.type.split('/')[1] || 'png';
            const filename = `pasted-image-${timestamp}.${extension}`;
            
            // Fileオブジェクトを作成
            const file = new File([blob], filename, { type: blob.type });
            
            // ローカルURLマップに追加
            localImageUrlMap.set(filename, URL.createObjectURL(file));
            
            // allFilesに追加（重複チェック）
            if (!allFiles.find((f) => f.name === filename)) {
              allFiles.push(file);
            }
            
            imagesToInsert.push(filename);
          }
        }
      }
      
      if (hasImage && imagesToInsert.length > 0) {
        // DataTransferを使ってimageInputのfilesを更新
        if (imageInput) {
          isUpdatingInputFiles = true; // フラグを立てる
          const dt = new DataTransfer();
          allFiles.forEach((file) => dt.items.add(file));
          imageInput.files = dt.files;
          setTimeout(() => { isUpdatingInputFiles = false; }, 0); // フラグを下ろす
        }
        
        // カーソル位置に画像記法を挿入
        const sel = window.getSelection();
        if (sel.rangeCount === 0) {
          const range = document.createRange();
          range.selectNodeContents(bodyEditor);
          range.collapse(false);
          sel.addRange(range);
        }
        
        const lines = imagesToInsert.map((filename) => `![説明](image:${filename})`);
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
        return;
      }
    }
    
    // 画像以外の貼り付け（テキストなど）の場合
    setTimeout(() => {
      processEditorContent();
      syncHiddenField();
    }, 0);
  });

  bodyEditor.addEventListener('blur', () => {
    syncHiddenField();
  });

  // 画像挿入
  if (insertImageButton) {
    insertImageButton.addEventListener('click', () => {
      const selection = window.getSelection();
      if (!isPreviewOnly && selection && selection.rangeCount > 0 && isLockedCardNode(selection.anchorNode)) {
        alert('コードカードや数式カード内に画像を挿入することはできません。');
        return;
      }
      imageInput?.click();
    });
  }

  if (insertTextButton) {
    insertTextButton.addEventListener('click', (e) => {
      e.preventDefault();
      const modal = ensureTextModal();
      modal.textarea.value = '';
      modal.overlay.style.display = 'flex';
      modal.overlay.classList.add('is-open');
      modal.textarea.focus();

      const onSave = () => {
        const value = modal.textarea.value || '';
        const token = serializeTextCard(value);
        if (bodySource) {
          insertTextIntoSource(`\n${token}\n`);
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
    });
  }

  if (insertUrlButton) {
    insertUrlButton.addEventListener('click', (e) => {
      e.preventDefault();
      const modal = ensureTextModal();
      modal.textarea.value = 'https://';
      modal.overlay.style.display = 'flex';
      modal.overlay.classList.add('is-open');
      modal.textarea.focus();

      const onSave = () => {
        const value = (modal.textarea.value || '').trim();
        if (value) {
          const token = serializeUrlCard(value);
          if (bodySource) {
            insertTextIntoSource(`\n${token}\n`);
          }
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
    });
  }

  if (openPreviewButton) {
    openPreviewButton.addEventListener('click', (e) => {
      e.preventDefault();
      const modal = ensurePreviewModal();
      const clone = bodyEditor.cloneNode(true);
      clone.removeAttribute('id');
      clone.querySelectorAll('button').forEach((btn) => btn.remove());
      modal.body.innerHTML = '';
      modal.body.appendChild(clone);
      modal.overlay.style.display = 'flex';
      modal.overlay.classList.add('is-open');

      const onClose = () => {
        modal.overlay.classList.remove('is-open');
        modal.overlay.style.display = 'none';
        modal.closeBtn.removeEventListener('click', onClose);
      };
      modal.closeBtn.addEventListener('click', onClose);
    });
  }

  if (imageInput) {
    imageInput.addEventListener('change', () => {
      // 再帰的なchangeイベントをスキップ
      if (isUpdatingInputFiles) return;
      
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

      isUpdatingInputFiles = true; // フラグを立てる
      const dt = new DataTransfer();
      allFiles.forEach((file) => dt.items.add(file));
      imageInput.files = dt.files;
      setTimeout(() => { isUpdatingInputFiles = false; }, 0); // フラグを下ろす

      if (isPreviewOnly && bodySource) {
        const lines = newFiles.map((file) => `![説明](image:${file.name})`);
        const text = lines.join('\n');
        insertTextIntoSource(text);
        return;
      }

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

      if (isPreviewOnly && bodySource) {
        const template = '\n```ruby\n\n```\n';
        insertTextIntoSource(template, -5);
        return;
      }

      const range = resolveEditorRange();
      if (!range) {
        alert('コードカードや数式カード内にコードを挿入することはできません。');
        return;
      }

      const existingCodeCards = new Set(Array.from(bodyEditor.querySelectorAll('.code-card')));
      const template = '\n```ruby\n\n```\n';
      const textNode = document.createTextNode(template);
      range.insertNode(textNode);
      
      // カーソルをコードブロック内に移動
      const sel = window.getSelection();
      const newRange = document.createRange();
      newRange.setStart(textNode, 10); // ```ruby\n の次
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);

      bodyEditor.focus();
      
      setTimeout(() => {
        processEditorContent();
        syncHiddenField();
        
        const allCodeCards = bodyEditor.querySelectorAll('.code-card');
        const newCodeCards = Array.from(allCodeCards).filter((card) => !existingCodeCards.has(card));
        const newCodeCard = newCodeCards.length > 0 ? newCodeCards[newCodeCards.length - 1] : null;
        
        if (newCodeCard) {
          const modal = ensureCodeModal();
          modal.textarea.value = '';
          modal.overlay.classList.add('is-open');
          modal.textarea.focus();

          const onSave = () => {
            newCodeCard.dataset.code = modal.textarea.value;
            const pre = newCodeCard.querySelector('pre');
            if (pre) pre.textContent = modal.textarea.value;
            modal.overlay.classList.remove('is-open');
            syncHiddenField();
            modal.saveBtn.removeEventListener('click', onSave);
            modal.cancelBtn.removeEventListener('click', onCancel);
          };
          const onCancel = () => {
            modal.overlay.classList.remove('is-open');
            const prevNode = newCodeCard.previousSibling;
            const nextNode = newCodeCard.nextSibling;
            newCodeCard.remove();
            [prevNode, nextNode].forEach((node) => {
              if (node && node.nodeType === Node.TEXT_NODE) {
                const text = (node.nodeValue || '').replace(/\u200b/g, '').trim();
                if (!text) node.remove();
              }
            });
            syncHiddenField();
            modal.saveBtn.removeEventListener('click', onSave);
            modal.cancelBtn.removeEventListener('click', onCancel);
          };

          modal.saveBtn.addEventListener('click', onSave);
          modal.cancelBtn.addEventListener('click', onCancel);
        }
      }, 50);
    });
  }

  // 数式挿入
  if (insertFormulaButton) {
    insertFormulaButton.addEventListener('click', (e) => {
      e.preventDefault();

      const currentSelection = window.getSelection();
      if (currentSelection && currentSelection.rangeCount > 0 && isLockedCardNode(currentSelection.anchorNode)) {
        alert('コードカードや数式カード内に数式を挿入することはできません。');
        return;
      }
      
      const selection = window.getSelection();
      let savedRange = null;
      if (selection && selection.rangeCount > 0 && bodyEditor.contains(selection.anchorNode) && !isLockedCardNode(selection.anchorNode)) {
        savedRange = selection.getRangeAt(0).cloneRange();
      }
      
      // モーダルを表示
      const modal = ensureFormulaModal();
      modal.textarea.value = '';
      if (modal.overlay) {
        modal.overlay.style.display = 'flex';
        modal.overlay.classList.add('is-open');
      }
      modal.textarea.focus();

      // イベントハンドラを一度実行して古いハンドラを削除
      const oldSaveBtn = modal.saveBtn.cloneNode(true);
      const oldCancelBtn = modal.cancelBtn.cloneNode(true);
      modal.saveBtn.parentNode.replaceChild(oldSaveBtn, modal.saveBtn);
      modal.cancelBtn.parentNode.replaceChild(oldCancelBtn, modal.cancelBtn);
      const newModal = {
        ...modal,
        saveBtn: oldSaveBtn,
        cancelBtn: oldCancelBtn
      };

      const onSave = () => {
        const formulaText = newModal.textarea.value || '';
        const formulaMarkdown = `\n\`\`formula\ntext:${formulaText}\n\`\`\n`;

        if (isPreviewOnly && bodySource) {
          insertTextIntoSource(formulaMarkdown);
          if (newModal.overlay) {
            newModal.overlay.classList.remove('is-open');
            newModal.overlay.style.display = 'none';
          }
          return;
        }
        
        // カーソル位置に挿入
        bodyEditor.focus();
        const sel = window.getSelection();
        if (!sel) return;

        if (savedRange && !isLockedCardNode(savedRange.startContainer)) {
          sel.removeAllRanges();
          sel.addRange(savedRange);
        } else {
          const fallbackRange = document.createRange();
          fallbackRange.selectNodeContents(bodyEditor);
          fallbackRange.collapse(false);
          sel.removeAllRanges();
          sel.addRange(fallbackRange);
        }

        const range = sel.getRangeAt(0);
        const textNode = document.createTextNode(formulaMarkdown);
        range.insertNode(textNode);
        range.setStartAfter(textNode);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        processEditorContent();
        syncHiddenField();
        
        if (newModal.overlay) {
          newModal.overlay.classList.remove('is-open');
          newModal.overlay.style.display = 'none';
        }
      };
      
      const onCancel = () => {
        if (newModal.overlay) {
          newModal.overlay.classList.remove('is-open');
          newModal.overlay.style.display = 'none';
        }
      };

      newModal.saveBtn.addEventListener('click', onSave);
      newModal.cancelBtn.addEventListener('click', onCancel);
    });
  }

  // フォーム送信時に同期
  const form = bodyEditor.closest('form');
  if (form) {
    form.addEventListener('submit', () => {
      syncHiddenField();
    });
  }

  if (bodySource && bodyHidden && bodySource.value !== bodyHidden.value) {
    bodySource.value = bodyHidden.value;
  }
}
