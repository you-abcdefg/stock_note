// ========== contenteditable 本文エディタの初期化 ==========

// 本文エディタのカード化・同期・ボタン操作をまとめて初期化する
document.addEventListener('DOMContentLoaded', initContentEditableEditor);
// 「document.addEventListener('DOMContentLoaded', initContentEditableEditor);」: document.addEventListenerを呼び出して必要な処理を実行する
document.addEventListener('turbolinks:load', initContentEditableEditor);
// 「document.addEventListener('turbolinks:load', initContentEditableEditor);」: document.addEventListenerを呼び出して必要な処理を実行する

function initContentEditableEditor() {
  const bodyEditor = document.getElementById('body-editor');
  // 「const bodyEditor = document.getElementById('body-editor');」: bodyEditorを保持する変数
  const bodyHidden = document.getElementById('body-hidden');
  // 「const bodyHidden = document.getElementById('body-hidden');」: bodyHiddenを保持する変数
  const bodySource = document.getElementById('body-source');
  // 「const bodySource = document.getElementById('body-source');」: bodySourceを保持する変数
  const isPreviewOnly = bodyEditor?.dataset.previewOnly === 'true';
  // 「const isPreviewOnly = bodyEditor?.dataset.previewOnly === 'true';」: isPreviewOnlyを保持する変数
  
  if (!bodyEditor || bodyEditor.dataset.initialized === 'true') return;
  // 「if (【条件】)」: 【条件】を判定する条件分岐
  bodyEditor.dataset.initialized = 'true';
  // 「bodyEditor.dataset.initialized = 'true';」: bodyEditor.dataset.initializedの値を設定・更新する代入先

  const insertImageButton = document.getElementById('insert-image-button');
  // 「const insertImageButton = document.getElementById('insert-image-button');」: insertImageButtonを保持する変数
  const insertCodeButton = document.getElementById('insert-code-button');
  // 「const insertCodeButton = document.getElementById('insert-code-button');」: insertCodeButtonを保持する変数
  const insertFormulaButton = document.getElementById('insert-formula-button');
  // 「const insertFormulaButton = document.getElementById('insert-formula-button');」: insertFormulaButtonを保持する変数
  const insertTextButton = document.getElementById('insert-text-button');
  // 「const insertTextButton = document.getElementById('insert-text-button');」: insertTextButtonを保持する変数
  const insertUrlButton = document.getElementById('insert-url-button');
  // 「const insertUrlButton = document.getElementById('insert-url-button');」: insertUrlButtonを保持する変数
  const openPreviewButton = document.getElementById('open-preview-modal-button');
  // 「const openPreviewButton = document.getElementById('open-preview-modal-button');」: openPreviewButtonを保持する変数
  const imageInput = document.getElementById('post_images');
  // 「const imageInput = document.getElementById('post_images');」: imageInputを保持する変数

  const allFiles = [];
  // 「const allFiles = [];」: allFilesを保持する変数
  const localImageUrlMap = window.localImageUrlMap || new Map();
  // 「const localImageUrlMap = window.localImageUrlMap || new Map();」: localImageUrlMapを保持する変数
  window.localImageUrlMap = localImageUrlMap;
  // 「window.localImageUrlMap = localImageUrlMap;」: window.localImageUrlMapの値を設定・更新する代入先
  let isUpdatingInputFiles = false; // changeイベントの再帰防止フラグ
  
  // ● コード・数式カードを構造化トークン形式で保存するための定数と正規表現をまとめて定義
  const CODE_TOKEN_PREFIX = '[[sn-code:';
  // CODE_TOKEN_PREFIX: コードカード用の保存形式プリフィックス（Base64 JSONをwrapする）
  const FORMULA_TOKEN_PREFIX = '[[sn-formula:';
  // 「const FORMULA_TOKEN_PREFIX = '[[sn-formula:';」: FORMULA_TOKEN_PREFIXを保持する変数
  const TEXT_TOKEN_PREFIX = '[[sn-text:';
  // 「const TEXT_TOKEN_PREFIX = '[[sn-text:';」: TEXT_TOKEN_PREFIXを保持する変数
  const URL_TOKEN_PREFIX = '[[sn-url:';
  // FORMULA_TOKEN_PREFIX: 数式カード用の保存形式プリフィックス（Base64 JSONをwrapする）
  const CODE_TOKEN_REGEX = /\[\[sn-code:([A-Za-z0-9+\/=]+)\]\]/;
  // CODE_TOKEN_REGEX: コードカードトークンの中身を抽出するパターン
  const FORMULA_TOKEN_REGEX = /\[\[sn-formula:([A-Za-z0-9+\/=]+)\]\]/;
  // 「const FORMULA_TOKEN_REGEX = /\[\[sn-formula:([A-Za-z0-9+\/=]+)\]\]/;」: FORMULA_TOKEN_REGEXを保持する変数
  const TEXT_TOKEN_REGEX = /\[\[sn-text:([A-Za-z0-9+\/=]+)\]\]/;
  // 「const TEXT_TOKEN_REGEX = /\[\[sn-text:([A-Za-z0-9+\/=]+)\]\]/;」: TEXT_TOKEN_REGEXを保持する変数
  const URL_TOKEN_REGEX = /\[\[sn-url:([A-Za-z0-9+\/=]+)\]\]/;
  // FORMULA_TOKEN_REGEX: 数式カードトークンの中身を抽出するパターン

  const isLockedCardNode = (node) => {
  // 「const isLockedCardNode = (node) =>;」: isLockedCardNodeを保持する変数
    if (!node) return false;
    // 「if (【条件】)」: 【条件】を判定する条件分岐
    const element = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
    // 「const element = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;」: elementを保持する変数
    return !!(element && element.closest('.code-card, .formula-card, .text-card, .url-card, .media-card'));
    // 「return !!(element && element.closest('.code-card, .formula-card, .text-card, .url-card, .media-card'));」: 呼び出し元へ!!(element && element.closest('.code-card, .formula-card, .text-card, .url-card, .media-card'))の値を返して処理を終了する
  };

  const resolveEditorRange = () => {
  // 「const resolveEditorRange = () =>;」: resolveEditorRangeを保持する変数
    const selection = window.getSelection();
    // 「const selection = window.getSelection();」: selectionを保持する変数
    if (!selection) return null;
    // 「if (【条件】)」: 【条件】を判定する条件分岐

    if (selection.rangeCount > 0) {
    // 「if (【条件】)」: 【条件】を判定する条件分岐
      const anchorNode = selection.anchorNode;
      // 「const anchorNode = selection.anchorNode;」: anchorNodeを保持する変数
      if (isLockedCardNode(anchorNode)) {
      // 「if (【条件】)」: 【条件】を判定する条件分岐
        return null;
        // 「return null;」: 呼び出し元へnullの値を返して処理を終了する
      }

      if (anchorNode && bodyEditor.contains(anchorNode)) {
      // 「if (【条件】)」: 【条件】を判定する条件分岐
        return selection.getRangeAt(0);
        // 「return selection.getRangeAt(0);」: 呼び出し元へselection.getRangeAt(0)の値を返して処理を終了する
      }
    }

    const fallbackRange = document.createRange();
    // 「const fallbackRange = document.createRange();」: fallbackRangeを保持する変数
    fallbackRange.selectNodeContents(bodyEditor);
    // 「fallbackRange.selectNodeContents(bodyEditor);」: fallbackRange.selectNodeContentsを呼び出して必要な処理を実行する
    fallbackRange.collapse(false);
    // 「fallbackRange.collapse(false);」: fallbackRange.collapseを呼び出して必要な処理を実行する
    selection.removeAllRanges();
    // 「selection.removeAllRanges(【引数】);」: selection.removeAllRangesを呼び出して必要な処理を実行する
    selection.addRange(fallbackRange);
    // 「selection.addRange(fallbackRange);」: selection.addRangeを呼び出して必要な処理を実行する
    return fallbackRange;
    // 「return fallbackRange;」: 呼び出し元へfallbackRangeの値を返して処理を終了する
  };

  const CARD_SELECTOR = '.media-card, .code-card, .formula-card, .text-card, .url-card';
  // 「const CARD_SELECTOR = '.media-card, .code-card, .formula-card, .text-card, .url-card';」: CARD_SELECTORを保持する変数

  const isMovableCard = (node) => {
  // 「const isMovableCard = (node) =>;」: isMovableCardを保持する変数
    return !!(node && node.nodeType === 1 && node.matches && node.matches(CARD_SELECTOR));
    // 「return !!(node && node.nodeType === 1 && node.matches && node.matches(CARD_SELECTOR));」: 呼び出し元へ!!(node && node.nodeType === 1 && node.matches && node.matches(CARD_SELECTOR))の値を返して処理を終了する
  };

  const getCardBundleNodes = (card) => {
  // 「const getCardBundleNodes = (card) =>;」: getCardBundleNodesを保持する変数
    if (!isMovableCard(card)) return [];
    // 「if (【条件】)」: 【条件】を判定する条件分岐
    if (card.classList.contains('media-card')) {
    // 「if (【条件】)」: 【条件】を判定する条件分岐
      const spacer = card.previousSibling;
      // 「const spacer = card.previousSibling;」: spacerを保持する変数
      if (spacer && spacer.nodeType === 1 && spacer.classList.contains('card-spacer')) {
      // 「if (【条件】)」: 【条件】を判定する条件分岐
        return [spacer, card];
        // 「return [spacer, card];」: 呼び出し元へ[spacer, card]の値を返して処理を終了する
      }
    }
    return [card];
    // 「return [card];」: 呼び出し元へ[card]の値を返して処理を終了する
  };

  const getInsertAnchorNode = (card) => {
  // 「const getInsertAnchorNode = (card) =>;」: getInsertAnchorNodeを保持する変数
    if (!isMovableCard(card)) return null;
    // 「if (【条件】)」: 【条件】を判定する条件分岐
    if (card.classList.contains('media-card')) {
    // 「if (【条件】)」: 【条件】を判定する条件分岐
      const spacer = card.previousSibling;
      // 「const spacer = card.previousSibling;」: spacerを保持する変数
      if (spacer && spacer.nodeType === 1 && spacer.classList.contains('card-spacer')) {
      // 「if (【条件】)」: 【条件】を判定する条件分岐
        return spacer;
        // 「return spacer;」: 呼び出し元へspacerの値を返して処理を終了する
      }
    }
    return card;
    // 「return card;」: 呼び出し元へcardの値を返して処理を終了する
  };

  const moveCardByDirection = (card, direction) => {
  // 「const moveCardByDirection = (card, direction) =>;」: moveCardByDirectionを保持する変数
    if (!isMovableCard(card)) return;
    // 「if (【条件】)」: 【条件】を判定する条件分岐

    const bundleNodes = getCardBundleNodes(card);
    // 「const bundleNodes = getCardBundleNodes(card);」: bundleNodesを保持する変数
    if (bundleNodes.length === 0) return;
    // 「if (【条件】)」: 【条件】を判定する条件分岐

    const fragment = document.createDocumentFragment();
    // 「const fragment = document.createDocumentFragment();」: fragmentを保持する変数
    bundleNodes.forEach((node) => fragment.appendChild(node));
    // 「bundleNodes.forEach((node) => fragment.appendChild(node));」: bundleNodes.forEachを呼び出して必要な処理を実行する

    if (direction === 'up') {
    // 「if (【条件】)」: 【条件】を判定する条件分岐
      let cursor = (getInsertAnchorNode(card) || card).previousSibling;
      // 「let cursor = (getInsertAnchorNode(card) || card).previousSibling;」: cursorを保持する変数
      while (cursor) {
      // 「while (【条件】)」: 【条件】が真の間だけ繰り返すループ
        if (isMovableCard(cursor)) {
        // 「if (【条件】)」: 【条件】を判定する条件分岐
          const targetAnchor = getInsertAnchorNode(cursor) || cursor;
          // 「const targetAnchor = getInsertAnchorNode(cursor) || cursor;」: targetAnchorを保持する変数
          bodyEditor.insertBefore(fragment, targetAnchor);
          // 「bodyEditor.insertBefore(fragment, targetAnchor);」: bodyEditor.insertBeforeを呼び出して必要な処理を実行する
          syncHiddenField();
          // 「syncHiddenField(【引数】);」: syncHiddenFieldを呼び出して必要な処理を実行する
          return;
          // 「return 【値】;」: 呼び出し元へ【値】の値を返して処理を終了する
        }
        cursor = cursor.previousSibling;
        // 「cursor = cursor.previousSibling;」: cursorの値を設定・更新する代入先
      }
      bodyEditor.insertBefore(fragment, bodyEditor.firstChild);
      // 「bodyEditor.insertBefore(fragment, bodyEditor.firstChild);」: bodyEditor.insertBeforeを呼び出して必要な処理を実行する
      syncHiddenField();
      // 「syncHiddenField(【引数】);」: syncHiddenFieldを呼び出して必要な処理を実行する
      return;
      // 「return 【値】;」: 呼び出し元へ【値】の値を返して処理を終了する
    }

    if (direction === 'down') {
    // 「if (【条件】)」: 【条件】を判定する条件分岐
      let cursor = bundleNodes[bundleNodes.length - 1].nextSibling;
      // 「let cursor = bundleNodes[bundleNodes.length - 1].nextSibling;」: cursorを保持する変数
      while (cursor) {
      // 「while (【条件】)」: 【条件】が真の間だけ繰り返すループ
        if (isMovableCard(cursor)) {
        // 「if (【条件】)」: 【条件】を判定する条件分岐
          const targetBundle = getCardBundleNodes(cursor);
          // 「const targetBundle = getCardBundleNodes(cursor);」: targetBundleを保持する変数
          const afterTarget = targetBundle[targetBundle.length - 1].nextSibling;
          // 「const afterTarget = targetBundle[targetBundle.length - 1].nextSibling;」: afterTargetを保持する変数
          bodyEditor.insertBefore(fragment, afterTarget);
          // 「bodyEditor.insertBefore(fragment, afterTarget);」: bodyEditor.insertBeforeを呼び出して必要な処理を実行する
          syncHiddenField();
          // 「syncHiddenField(【引数】);」: syncHiddenFieldを呼び出して必要な処理を実行する
          return;
          // 「return 【値】;」: 呼び出し元へ【値】の値を返して処理を終了する
        }
        cursor = cursor.nextSibling;
        // 「cursor = cursor.nextSibling;」: cursorの値を設定・更新する代入先
      }
      bodyEditor.appendChild(fragment);
      // 「bodyEditor.appendChild(fragment);」: bodyEditor.appendChildを呼び出して必要な処理を実行する
      syncHiddenField();
      // 「syncHiddenField(【引数】);」: syncHiddenFieldを呼び出して必要な処理を実行する
    }
  };

  const setCardMoveHandlers = (card) => {
  // 「const setCardMoveHandlers = (card) =>;」: setCardMoveHandlersを保持する変数
    if (!isMovableCard(card)) return;
    // 「if (【条件】)」: 【条件】を判定する条件分岐

    const upButton = card.querySelector('.card-move-up-btn');
    // 「const upButton = card.querySelector('.card-move-up-btn');」: upButtonを保持する変数
    const downButton = card.querySelector('.card-move-down-btn');
    // 「const downButton = card.querySelector('.card-move-down-btn');」: downButtonを保持する変数

    if (upButton && upButton.dataset.initialized !== 'true') {
    // 「if (【条件】)」: 【条件】を判定する条件分岐
      upButton.dataset.initialized = 'true';
      // 「upButton.dataset.initialized = 'true';」: upButton.dataset.initializedの値を設定・更新する代入先
      upButton.addEventListener('click', (e) => {
        e.preventDefault();
        // 「e.preventDefault(【引数】);」: e.preventDefaultを呼び出して必要な処理を実行する
        e.stopPropagation();
        // 「e.stopPropagation(【引数】);」: e.stopPropagationを呼び出して必要な処理を実行する
        moveCardByDirection(card, 'up');
        // 「moveCardByDirection(card, 'up');」: moveCardByDirectionを呼び出して必要な処理を実行する
      });
    }

    if (downButton && downButton.dataset.initialized !== 'true') {
    // 「if (【条件】)」: 【条件】を判定する条件分岐
      downButton.dataset.initialized = 'true';
      // 「downButton.dataset.initialized = 'true';」: downButton.dataset.initializedの値を設定・更新する代入先
      downButton.addEventListener('click', (e) => {
        e.preventDefault();
        // 「e.preventDefault(【引数】);」: e.preventDefaultを呼び出して必要な処理を実行する
        e.stopPropagation();
        // 「e.stopPropagation(【引数】);」: e.stopPropagationを呼び出して必要な処理を実行する
        moveCardByDirection(card, 'down');
        // 「moveCardByDirection(card, 'down');」: moveCardByDirectionを呼び出して必要な処理を実行する
      });
    }
  };

  // HTML特殊文字をエスケープ
  const escapeHtml = (text) => {
  // 「const escapeHtml = (text) =>;」: escapeHtmlを保持する変数
    const map = {
    // 「const map = 【値】;」: mapを保持する変数
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
    // 「return text.replace(/[&<>"']/g, (m) => map[m]);」: 呼び出し元へtext.replace(/[&<>"']/g, (m) => map[m])の値を返して処理を終了する
  };

    // ● 保存形式の暗号化・復号化を行うBase64エンコード関数
    const encodeBase64Utf8 = (value) => {
      // encodeBase64Utf8: JSON文字列をBase64でエンコードして保存形式に変換する
      const utf8 = encodeURIComponent(value).replace(/%([0-9A-F]{2})/g, (_, hex) => {
        // utf8: URLエンコード後の値をバイト列に変換
        // encodeURIComponent: 日本語などを%XX形式に変換（UTF-8互換性確保）
        // parseInt: %XX形式をcharCodeに変換
        return String.fromCharCode(parseInt(hex, 16));
        // 「return String.fromCharCode(parseInt(hex, 16));」: 呼び出し元へString.fromCharCode(parseInt(hex, 16))の値を返して処理を終了する
      });
      return btoa(utf8);
      // btoa: バイト列をBase64文字列に変換して返す
    };

    const decodeBase64Utf8 = (value) => {
      // decodeBase64Utf8: Base64形式の保存データをJSON文字列に復号化する
      const binary = atob(value);
      // binary: Base64文字列をバイト列に戻す
      const escaped = Array.from(binary)
      // 「const escaped = Array.from(binary);」: escapedを保持する変数
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
      // 「if (【条件】)」: 【条件】を判定する条件分岐
      try {
      // 「try」: 例外が発生する可能性のある処理を監視するブロック
        return JSON.parse(decodeBase64Utf8(matched[1]));
        // matched[1]: 正規表現の第1グループ（Base64部分）を復号化してJSON化
      } catch (_error) {
      // 「catch (【例外】)」: 発生した例外を受け取って処理するブロック
        return null;
        // 「return null;」: 呼び出し元へnullの値を返して処理を終了する
      }
    };

    // ● コードカードの言語・内容をJSON形式で暗号化して保存トークン化
    const serializeCodeCard = (lang, code) => {
      // serializeCodeCard: コード言語と内容をBase64 JSONトークンに変換して保存形式化
      const payload = encodeBase64Utf8(JSON.stringify({ lang: lang || '', code: code || '' }));
      // payload: {lang, code}をJSON化してBase64エンコード
      // lang、code: コードカードの属性を構造化データとして保存
      return `${CODE_TOKEN_PREFIX}${payload}]]`;
      // 「return `${CODE_TOKEN_PREFIX}${payload}]]`;」: 呼び出し元へ`${CODE_TOKEN_PREFIX}${payload}]]`の値を返して処理を終了する
    };

    const serializeFormulaCard = (formula) => {
      // serializeFormulaCard: 数式テキストをBase64 JSONトークンに変換して保存形式化
      const payload = encodeBase64Utf8(JSON.stringify({ formula: formula || '' }));
      // payload: {formula}をJSON化してBase64エンコード
      return `${FORMULA_TOKEN_PREFIX}${payload}]]`;
      // 「return `${FORMULA_TOKEN_PREFIX}${payload}]]`;」: 呼び出し元へ`${FORMULA_TOKEN_PREFIX}${payload}]]`の値を返して処理を終了する
    };

    const serializeTextCard = (text) => {
    // 「const serializeTextCard = (text) =>;」: serializeTextCardを保持する変数
      const payload = encodeBase64Utf8(JSON.stringify({ text: text || '' }));
      // 「const payload = encodeBase64Utf8(JSON.stringify({ text: text || '' }));」: payloadを保持する変数
      return `${TEXT_TOKEN_PREFIX}${payload}]]`;
      // 「return `${TEXT_TOKEN_PREFIX}${payload}]]`;」: 呼び出し元へ`${TEXT_TOKEN_PREFIX}${payload}]]`の値を返して処理を終了する
    };

    const serializeUrlCard = (url) => {
    // 「const serializeUrlCard = (url) =>;」: serializeUrlCardを保持する変数
      const payload = encodeBase64Utf8(JSON.stringify({ url: url || '' }));
      // 「const payload = encodeBase64Utf8(JSON.stringify({ url: url || '' }));」: payloadを保持する変数
      return `${URL_TOKEN_PREFIX}${payload}]]`;
      // 「return `${URL_TOKEN_PREFIX}${payload}]]`;」: 呼び出し元へ`${URL_TOKEN_PREFIX}${payload}]]`の値を返して処理を終了する
    };

    // ● 数式カードの保存形式を解釈して、新トークン形式・旧フェンス形式の両方に対応
    const parseFormulaContent = (rawFormula) => {
      // parseFormulaContent: 数式カードテキストから実際の数式文字列を抽出（新旧両形式対応）
      const tokenPayload = decodeSerializedPayload(FORMULA_TOKEN_REGEX, rawFormula);
      // tokenPayload: 新形式 [[sn-formula:...]] からJSON化された内容を取得
      if (tokenPayload && typeof tokenPayload.formula === 'string') {
        // 「if (【条件】)」: 【条件】を判定する条件分岐
        return tokenPayload.formula;
        // 「return tokenPayload.formula;」: 呼び出し元へtokenPayload.formulaの値を返して処理を終了する
      }

      const match = (rawFormula || '').match(/``formula\s*\ntext:([\s\S]*?)\n``/);
      // match: 旧形式 ``formula\ntext:...\n`` をパターンマッチで取得
      if (match) {
        // 「if (【条件】)」: 【条件】を判定する条件分岐
        return match[1].trim();
        // 「return match[1].trim();」: 呼び出し元へmatch[1].trim()の値を返して処理を終了する
      }

      // 「else」: 上記条件に当てはまらない場合の分岐
      return (rawFormula || '')
      // 「return (rawFormula || '');」: 呼び出し元へ(rawFormula || '')の値を返して処理を終了する
        .replace(/``formula\s*\n?/g, '')
        .replace(/\n?``\s*$/g, '')
        .trim();
    };

    const parseTextContent = (rawText) => {
    // 「const parseTextContent = (rawText) =>;」: parseTextContentを保持する変数
      const tokenPayload = decodeSerializedPayload(TEXT_TOKEN_REGEX, rawText);
      // 「const tokenPayload = decodeSerializedPayload(TEXT_TOKEN_REGEX, rawText);」: tokenPayloadを保持する変数
      if (tokenPayload && typeof tokenPayload.text === 'string') {
      // 「if (【条件】)」: 【条件】を判定する条件分岐
        return tokenPayload.text;
        // 「return tokenPayload.text;」: 呼び出し元へtokenPayload.textの値を返して処理を終了する
      }
      return (rawText || '').trim();
      // 「return (rawText || '').trim();」: 呼び出し元へ(rawText || '').trim()の値を返して処理を終了する
    };

    const parseUrlContent = (rawText) => {
    // 「const parseUrlContent = (rawText) =>;」: parseUrlContentを保持する変数
      const tokenPayload = decodeSerializedPayload(URL_TOKEN_REGEX, rawText);
      // 「const tokenPayload = decodeSerializedPayload(URL_TOKEN_REGEX, rawText);」: tokenPayloadを保持する変数
      if (tokenPayload && typeof tokenPayload.url === 'string') {
      // 「if (【条件】)」: 【条件】を判定する条件分岐
        return tokenPayload.url;
        // 「return tokenPayload.url;」: 呼び出し元へtokenPayload.urlの値を返して処理を終了する
      }
      return (rawText || '').trim();
      // 「return (rawText || '').trim();」: 呼び出し元へ(rawText || '').trim()の値を返して処理を終了する
    };

    const parseFence = (text) => {
    // 「const parseFence = (text) =>;」: parseFenceを保持する変数
      const match = text.match(/^```([^\n]*)\n([\s\S]*?)\n```$/);
      // 「const match = text.match(/^```([^\n]*)\n([\s\S]*?)\n```$/);」: matchを保持する変数
      return {
      // 「return 【値】;」: 呼び出し元へ【値】の値を返して処理を終了する
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
        // 「if (【条件】)」: 【条件】を判定する条件分岐
        return {
        // 「return 【値】;」: 呼び出し元へ【値】の値を返して処理を終了する
          lang: typeof tokenPayload.lang === 'string' ? tokenPayload.lang : '',
          // lang: コード言語指定（存在しない場合は空文字）
          code: tokenPayload.code
          // code: コード本体
        };
      }
      return parseFence(rawCode);
      // 「return parseFence(rawCode);」: 呼び出し元へparseFence(rawCode)の値を返して処理を終了する
    };

    const getCodePreview = (code) => {
    // 「const getCodePreview = (code) =>;」: getCodePreviewを保持する変数
      const plain = (code || '').replace(/\s+/g, ' ').trim();
      // 「const plain = (code || '').replace(/\s+/g, ' ').trim();」: plainを保持する変数
      return plain.slice(0, 10);
      // 「return plain.slice(0, 10);」: 呼び出し元へplain.slice(0, 10)の値を返して処理を終了する
    };

    const ensureFormulaModal = () => {
    // 「const ensureFormulaModal = () =>;」: ensureFormulaModalを保持する変数
      if (document.getElementById('formula-editor-overlay')) {
      // 「if (【条件】)」: 【条件】を判定する条件分岐
        return {
        // 「return 【値】;」: 呼び出し元へ【値】の値を返して処理を終了する
          overlay: document.getElementById('formula-editor-overlay'),
          textarea: document.getElementById('formula-editor-textarea'),
          saveBtn: document.getElementById('formula-save'),
          cancelBtn: document.getElementById('formula-cancel')
        };
      }

      const overlay = document.createElement('div');
      // 「const overlay = document.createElement('div');」: overlayを保持する変数
      overlay.id = 'formula-editor-overlay';
      // 「overlay.id = 'formula-editor-overlay';」: overlay.idの値を設定・更新する代入先
      overlay.className = 'formula-editor-overlay';
      // 「overlay.className = 'formula-editor-overlay';」: overlay.classNameの値を設定・更新する代入先
      overlay.innerHTML = `
      // 「overlay.innerHTML = `;」: overlay.innerHTMLの値を設定・更新する代入先
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
      // 「const style = document.createElement('style');」: styleを保持する変数
      if (!document.querySelector('style[data-formula-modal]')) {
      // 「if (【条件】)」: 【条件】を判定する条件分岐
        style.setAttribute('data-formula-modal', 'true');
        // 「style.setAttribute('data-formula-modal', 'true');」: style.setAttributeを呼び出して必要な処理を実行する
        style.textContent = `
        // 「style.textContent = `;」: style.textContentの値を設定・更新する代入先
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
        // 「document.head.appendChild(style);」: document.head.appendChildを呼び出して必要な処理を実行する
      }
      
      document.body.appendChild(overlay);
      // 「document.body.appendChild(overlay);」: document.body.appendChildを呼び出して必要な処理を実行する

      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
        // 「if (【条件】)」: 【条件】を判定する条件分岐
          overlay.classList.remove('is-open');
          // 「overlay.classList.remove('is-open');」: overlay.classList.removeを呼び出して必要な処理を実行する
          overlay.style.display = 'none';
          // 「overlay.style.display = 'none';」: overlay.style.displayの値を設定・更新する代入先
        }
      });

      return {
      // 「return 【値】;」: 呼び出し元へ【値】の値を返して処理を終了する
        overlay,
        textarea: overlay.querySelector('#formula-editor-textarea'),
        saveBtn: overlay.querySelector('#formula-save'),
        cancelBtn: overlay.querySelector('#formula-cancel')
      };
    };

    const ensureCodeModal = () => {
    // 「const ensureCodeModal = () =>;」: ensureCodeModalを保持する変数
      if (document.getElementById('code-editor-overlay')) {
      // 「if (【条件】)」: 【条件】を判定する条件分岐
        return {
        // 「return 【値】;」: 呼び出し元へ【値】の値を返して処理を終了する
          overlay: document.getElementById('code-editor-overlay'),
          textarea: document.getElementById('code-editor-textarea'),
          saveBtn: document.getElementById('code-editor-save'),
          cancelBtn: document.getElementById('code-editor-cancel')
        };
      }

      const overlay = document.createElement('div');
      // 「const overlay = document.createElement('div');」: overlayを保持する変数
      overlay.id = 'code-editor-overlay';
      // 「overlay.id = 'code-editor-overlay';」: overlay.idの値を設定・更新する代入先
      overlay.className = 'code-editor-overlay';
      // 「overlay.className = 'code-editor-overlay';」: overlay.classNameの値を設定・更新する代入先
      overlay.innerHTML = `
      // 「overlay.innerHTML = `;」: overlay.innerHTMLの値を設定・更新する代入先
        <div class="code-editor-modal">
          <!-- ***** div.code-editor-modal：コード編集モーダル全体を包むコンテナ ***** -->
          <div class="code-editor-header">
            <!-- ***** div.code-editor-header：モーダルのヘッダー領域 ***** -->
            <span>コードを編集</span>
            <!-- ***** span：モーダルタイトルを表示するテキスト要素 ***** -->
          </div>
          <!-- ***** </div>：code-editor-headerの終了 ***** -->
          <textarea id="code-editor-textarea" class="code-editor-textarea"></textarea>
          <!-- ***** textarea#code-editor-textarea：編集対象コードを入力・編集するテキストエリア ***** -->
          <div class="code-editor-actions">
            <!-- ***** div.code-editor-actions：操作ボタンを配置するフッター領域 ***** -->
            <button type="button" id="code-editor-cancel" class="btn btn-sm btn-outline-secondary">キャンセル</button>
            <!-- ***** button#code-editor-cancel：編集を破棄してモーダルを閉じるキャンセルボタン ***** -->
            <button type="button" id="code-editor-save" class="btn btn-sm btn-primary">保存</button>
            <!-- ***** button#code-editor-save：編集内容を保存して反映する確定ボタン ***** -->
          </div>
          <!-- ***** </div>：code-editor-actionsの終了 ***** -->
        </div>
        <!-- ***** </div>：code-editor-modalの終了 ***** -->
      `;
      
      // モーダルの完全なスタイルをJavaScriptで定義
      if (!document.querySelector('style[data-code-modal]')) {
      // 「if (【条件】)」: 【条件】を判定する条件分岐
        const style = document.createElement('style');
        // 「const style = document.createElement('style');」: styleを保持する変数
        style.setAttribute('data-code-modal', 'true');
        // 「style.setAttribute('data-code-modal', 'true');」: style.setAttributeを呼び出して必要な処理を実行する
        style.textContent = `
        // 「style.textContent = `;」: style.textContentの値を設定・更新する代入先
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
        // 「document.head.appendChild(style);」: document.head.appendChildを呼び出して必要な処理を実行する
      }
      
      document.body.appendChild(overlay);
      // 「document.body.appendChild(overlay);」: document.body.appendChildを呼び出して必要な処理を実行する

      const textarea = overlay.querySelector('#code-editor-textarea');
      // 「const textarea = overlay.querySelector('#code-editor-textarea');」: textareaを保持する変数
      const saveBtn = overlay.querySelector('#code-editor-save');
      // 「const saveBtn = overlay.querySelector('#code-editor-save');」: saveBtnを保持する変数
      const cancelBtn = overlay.querySelector('#code-editor-cancel');
      // 「const cancelBtn = overlay.querySelector('#code-editor-cancel');」: cancelBtnを保持する変数

      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
        // 「if (【条件】)」: 【条件】を判定する条件分岐
          overlay.classList.remove('is-open');
          // 「overlay.classList.remove('is-open');」: overlay.classList.removeを呼び出して必要な処理を実行する
          overlay.style.display = 'none';
          // 「overlay.style.display = 'none';」: overlay.style.displayの値を設定・更新する代入先
        }
      });

      return { overlay, textarea, saveBtn, cancelBtn };
      // 「return { overlay, textarea, saveBtn, cancelBtn };」: 呼び出し元へ{ overlay, textarea, saveBtn, cancelBtn }の値を返して処理を終了する
    };

    const ensureTextModal = () => {
    // 「const ensureTextModal = () =>;」: ensureTextModalを保持する変数
      if (document.getElementById('text-editor-overlay')) {
      // 「if (【条件】)」: 【条件】を判定する条件分岐
        return {
        // 「return 【値】;」: 呼び出し元へ【値】の値を返して処理を終了する
          overlay: document.getElementById('text-editor-overlay'),
          textarea: document.getElementById('text-editor-textarea'),
          saveBtn: document.getElementById('text-editor-save'),
          cancelBtn: document.getElementById('text-editor-cancel')
        };
      }

      const overlay = document.createElement('div');
      // 「const overlay = document.createElement('div');」: overlayを保持する変数
      overlay.id = 'text-editor-overlay';
      // 「overlay.id = 'text-editor-overlay';」: overlay.idの値を設定・更新する代入先
      overlay.className = 'code-editor-overlay';
      // 「overlay.className = 'code-editor-overlay';」: overlay.classNameの値を設定・更新する代入先
      overlay.innerHTML = `
      // 「overlay.innerHTML = `;」: overlay.innerHTMLの値を設定・更新する代入先
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
      // 「document.body.appendChild(overlay);」: document.body.appendChildを呼び出して必要な処理を実行する
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
        // 「if (【条件】)」: 【条件】を判定する条件分岐
          overlay.classList.remove('is-open');
          // 「overlay.classList.remove('is-open');」: overlay.classList.removeを呼び出して必要な処理を実行する
          overlay.style.display = 'none';
          // 「overlay.style.display = 'none';」: overlay.style.displayの値を設定・更新する代入先
        }
      });

      return {
      // 「return 【値】;」: 呼び出し元へ【値】の値を返して処理を終了する
        overlay,
        textarea: overlay.querySelector('#text-editor-textarea'),
        saveBtn: overlay.querySelector('#text-editor-save'),
        cancelBtn: overlay.querySelector('#text-editor-cancel')
      };
    };

    const ensurePreviewModal = () => {
    // 「const ensurePreviewModal = () =>;」: ensurePreviewModalを保持する変数
      if (document.getElementById('post-preview-overlay')) {
      // 「if (【条件】)」: 【条件】を判定する条件分岐
        return {
        // 「return 【値】;」: 呼び出し元へ【値】の値を返して処理を終了する
          overlay: document.getElementById('post-preview-overlay'),
          body: document.getElementById('post-preview-body'),
          closeBtn: document.getElementById('post-preview-close')
        };
      }

      const overlay = document.createElement('div');
      // 「const overlay = document.createElement('div');」: overlayを保持する変数
      overlay.id = 'post-preview-overlay';
      // 「overlay.id = 'post-preview-overlay';」: overlay.idの値を設定・更新する代入先
      overlay.className = 'code-editor-overlay';
      // 「overlay.className = 'code-editor-overlay';」: overlay.classNameの値を設定・更新する代入先
      overlay.innerHTML = `
      // 「overlay.innerHTML = `;」: overlay.innerHTMLの値を設定・更新する代入先
        <div class="code-editor-modal" style="max-width: 1000px; height: min(80vh, 700px);">
          <div class="code-editor-header" style="display:flex; justify-content:space-between; align-items:center;">
            <span>投稿全体プレビュー</span>
            <button type="button" id="post-preview-close" class="btn btn-sm btn-outline-secondary">閉じる</button>
          </div>
          <div id="post-preview-body" style="flex:1; overflow:auto; border:1px solid #dee2e6; border-radius:6px; padding:12px; background:#fff;"></div>
        </div>
      `;

      document.body.appendChild(overlay);
      // 「document.body.appendChild(overlay);」: document.body.appendChildを呼び出して必要な処理を実行する
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
        // 「if (【条件】)」: 【条件】を判定する条件分岐
          overlay.classList.remove('is-open');
          // 「overlay.classList.remove('is-open');」: overlay.classList.removeを呼び出して必要な処理を実行する
          overlay.style.display = 'none';
          // 「overlay.style.display = 'none';」: overlay.style.displayの値を設定・更新する代入先
        }
      });

      return {
      // 「return 【値】;」: 呼び出し元へ【値】の値を返して処理を終了する
        overlay,
        body: overlay.querySelector('#post-preview-body'),
        closeBtn: overlay.querySelector('#post-preview-close')
      };
    };

  const buildTextCard = (rawText) => {
  // 「const buildTextCard = (rawText) =>;」: buildTextCardを保持する変数
    const card = document.createElement('div');
    // 「const card = document.createElement('div');」: cardを保持する変数
    card.className = 'text-card';
    // 「card.className = 'text-card';」: card.classNameの値を設定・更新する代入先
    card.contentEditable = 'false';
    // 「card.contentEditable = 'false';」: card.contentEditableの値を設定・更新する代入先
    const content = parseTextContent(rawText);
    // 「const content = parseTextContent(rawText);」: contentを保持する変数
    card.dataset.text = content;
    // 「card.dataset.text = content;」: card.dataset.textの値を設定・更新する代入先
    card.innerHTML = `<div class="text-card-body">${escapeHtml(content).replace(/\n/g, '<br>')}</div><button class="card-move-up-btn" type="button" contenteditable="false" style="position: absolute; top: 0; right: 110px; background: #6c757d; color: white; border: none; padding: 2px 6px; border-radius: 2px; font-size: 10px; cursor: pointer;">上へ</button><button class="card-move-down-btn" type="button" contenteditable="false" style="position: absolute; top: 0; right: 74px; background: #6c757d; color: white; border: none; padding: 2px 6px; border-radius: 2px; font-size: 10px; cursor: pointer;">下へ</button><button class="card-edit-btn" type="button" contenteditable="false" style="position: absolute; top: 0; right: 38px; background: #0d6efd; color: white; border: none; padding: 2px 6px; border-radius: 2px; font-size: 10px; cursor: pointer;">編集</button><button class="card-delete-btn" type="button" contenteditable="false" style="position: absolute; top: 0; right: 2px; background: #dc3545; color: white; border: none; padding: 2px 6px; border-radius: 2px; font-size: 9px; cursor: pointer;">削除</button>`;
    // 「card.innerHTML = `<div class="text-card-body">${escapeHtml(content).replace(/\n/g, '<br>')}</div><button class="card-move-up-btn" type="button" contenteditable="false" style="position: absolute; top: 0; right: 110px; background: #6c757d; color: white; border: none; padding: 2px 6px; border-radius: 2px; font-size: 10px; cursor: pointer;">上へ</button><button class="card-move-down-btn" type="button" contenteditable="false" style="position: absolute; top: 0; right: 74px; background: #6c757d; color: white; border: none; padding: 2px 6px; border-radius: 2px; font-size: 10px; cursor: pointer;">下へ</button><button class="card-edit-btn" type="button" contenteditable="false" style="position: absolute; top: 0; right: 38px; background: #0d6efd; color: white; border: none; padding: 2px 6px; border-radius: 2px; font-size: 10px; cursor: pointer;">編集</button><button class="card-delete-btn" type="button" contenteditable="false" style="position: absolute; top: 0; right: 2px; background: #dc3545; color: white; border: none; padding: 2px 6px; border-radius: 2px; font-size: 9px; cursor: pointer;">削除</button>`;」: card.innerHTMLの値を設定・更新する代入先

    card.querySelector('.card-edit-btn').addEventListener('click', (e) => {
      e.preventDefault();
      // 「e.preventDefault(【引数】);」: e.preventDefaultを呼び出して必要な処理を実行する
      e.stopPropagation();
      // 「e.stopPropagation(【引数】);」: e.stopPropagationを呼び出して必要な処理を実行する
      const modal = ensureTextModal();
      // 「const modal = ensureTextModal();」: modalを保持する変数
      modal.textarea.value = card.dataset.text || '';
      // 「modal.textarea.value = card.dataset.text || '';」: modal.textarea.valueの値を設定・更新する代入先
      modal.overlay.style.display = 'flex';
      // 「modal.overlay.style.display = 'flex';」: modal.overlay.style.displayの値を設定・更新する代入先
      modal.overlay.classList.add('is-open');
      // 「modal.overlay.classList.add('is-open');」: modal.overlay.classList.addを呼び出して必要な処理を実行する
      modal.textarea.focus();
      // 「modal.textarea.focus(【引数】);」: modal.textarea.focusを呼び出して必要な処理を実行する

      const onSave = () => {
      // 「const onSave = () =>;」: onSaveを保持する変数
        card.dataset.text = modal.textarea.value;
        // 「card.dataset.text = modal.textarea.value;」: card.dataset.textの値を設定・更新する代入先
        const body = card.querySelector('.text-card-body');
        // 「const body = card.querySelector('.text-card-body');」: bodyを保持する変数
        if (body) body.innerHTML = escapeHtml(modal.textarea.value).replace(/\n/g, '<br>');
        // 「if (【条件】)」: 【条件】を判定する条件分岐
        modal.overlay.classList.remove('is-open');
        // 「modal.overlay.classList.remove('is-open');」: modal.overlay.classList.removeを呼び出して必要な処理を実行する
        modal.overlay.style.display = 'none';
        // 「modal.overlay.style.display = 'none';」: modal.overlay.style.displayの値を設定・更新する代入先
        modal.saveBtn.removeEventListener('click', onSave);
        // 「modal.saveBtn.removeEventListener('click', onSave);」: modal.saveBtn.removeEventListenerを呼び出して必要な処理を実行する
        modal.cancelBtn.removeEventListener('click', onCancel);
        // 「modal.cancelBtn.removeEventListener('click', onCancel);」: modal.cancelBtn.removeEventListenerを呼び出して必要な処理を実行する
        syncHiddenField();
        // 「syncHiddenField(【引数】);」: syncHiddenFieldを呼び出して必要な処理を実行する
      };
      const onCancel = () => {
      // 「const onCancel = () =>;」: onCancelを保持する変数
        modal.overlay.classList.remove('is-open');
        // 「modal.overlay.classList.remove('is-open');」: modal.overlay.classList.removeを呼び出して必要な処理を実行する
        modal.overlay.style.display = 'none';
        // 「modal.overlay.style.display = 'none';」: modal.overlay.style.displayの値を設定・更新する代入先
        modal.saveBtn.removeEventListener('click', onSave);
        // 「modal.saveBtn.removeEventListener('click', onSave);」: modal.saveBtn.removeEventListenerを呼び出して必要な処理を実行する
        modal.cancelBtn.removeEventListener('click', onCancel);
        // 「modal.cancelBtn.removeEventListener('click', onCancel);」: modal.cancelBtn.removeEventListenerを呼び出して必要な処理を実行する
      };

      modal.saveBtn.addEventListener('click', onSave);
      // 「modal.saveBtn.addEventListener('click', onSave);」: modal.saveBtn.addEventListenerを呼び出して必要な処理を実行する
      modal.cancelBtn.addEventListener('click', onCancel);
      // 「modal.cancelBtn.addEventListener('click', onCancel);」: modal.cancelBtn.addEventListenerを呼び出して必要な処理を実行する
    });

    card.querySelector('.card-delete-btn').addEventListener('click', (e) => {
      e.preventDefault();
      // 「e.preventDefault(【引数】);」: e.preventDefaultを呼び出して必要な処理を実行する
      e.stopPropagation();
      // 「e.stopPropagation(【引数】);」: e.stopPropagationを呼び出して必要な処理を実行する
      card.remove();
      // 「card.remove(【引数】);」: card.removeを呼び出して必要な処理を実行する
      syncHiddenField();
      // 「syncHiddenField(【引数】);」: syncHiddenFieldを呼び出して必要な処理を実行する
    });

    setCardMoveHandlers(card);
    // 「setCardMoveHandlers(card);」: setCardMoveHandlersを呼び出して必要な処理を実行する
    return card;
    // 「return card;」: 呼び出し元へcardの値を返して処理を終了する
  };

  const buildUrlCard = (rawUrl) => {
  // 「const buildUrlCard = (rawUrl) =>;」: buildUrlCardを保持する変数
    const card = document.createElement('div');
    // 「const card = document.createElement('div');」: cardを保持する変数
    card.className = 'url-card';
    // 「card.className = 'url-card';」: card.classNameの値を設定・更新する代入先
    card.contentEditable = 'false';
    // 「card.contentEditable = 'false';」: card.contentEditableの値を設定・更新する代入先
    const url = parseUrlContent(rawUrl);
    // 「const url = parseUrlContent(rawUrl);」: urlを保持する変数
    card.dataset.url = url;
    // 「card.dataset.url = url;」: card.dataset.urlの値を設定・更新する代入先
    card.innerHTML = `<pre class="url-card-body">${escapeHtml(url)}</pre><button class="card-move-up-btn" type="button" contenteditable="false" style="position: absolute; top: 0; right: 110px; background: #6c757d; color: white; border: none; padding: 2px 6px; border-radius: 2px; font-size: 10px; cursor: pointer;">上へ</button><button class="card-move-down-btn" type="button" contenteditable="false" style="position: absolute; top: 0; right: 74px; background: #6c757d; color: white; border: none; padding: 2px 6px; border-radius: 2px; font-size: 10px; cursor: pointer;">下へ</button><button class="card-edit-btn" type="button" contenteditable="false" style="position: absolute; top: 0; right: 38px; background: #0d6efd; color: white; border: none; padding: 2px 6px; border-radius: 2px; font-size: 10px; cursor: pointer;">編集</button><button class="card-delete-btn" type="button" contenteditable="false" style="position: absolute; top: 0; right: 2px; background: #dc3545; color: white; border: none; padding: 2px 6px; border-radius: 2px; font-size: 9px; cursor: pointer;">削除</button>`;
    // 「card.innerHTML = `<pre class="url-card-body">${escapeHtml(url)}</pre><button class="card-move-up-btn" type="button" contenteditable="false" style="position: absolute; top: 0; right: 110px; background: #6c757d; color: white; border: none; padding: 2px 6px; border-radius: 2px; font-size: 10px; cursor: pointer;">上へ</button><button class="card-move-down-btn" type="button" contenteditable="false" style="position: absolute; top: 0; right: 74px; background: #6c757d; color: white; border: none; padding: 2px 6px; border-radius: 2px; font-size: 10px; cursor: pointer;">下へ</button><button class="card-edit-btn" type="button" contenteditable="false" style="position: absolute; top: 0; right: 38px; background: #0d6efd; color: white; border: none; padding: 2px 6px; border-radius: 2px; font-size: 10px; cursor: pointer;">編集</button><button class="card-delete-btn" type="button" contenteditable="false" style="position: absolute; top: 0; right: 2px; background: #dc3545; color: white; border: none; padding: 2px 6px; border-radius: 2px; font-size: 9px; cursor: pointer;">削除</button>`;」: card.innerHTMLの値を設定・更新する代入先

    card.querySelector('.card-edit-btn').addEventListener('click', (e) => {
      e.preventDefault();
      // 「e.preventDefault(【引数】);」: e.preventDefaultを呼び出して必要な処理を実行する
      e.stopPropagation();
      // 「e.stopPropagation(【引数】);」: e.stopPropagationを呼び出して必要な処理を実行する
      const modal = ensureTextModal();
      // 「const modal = ensureTextModal();」: modalを保持する変数
      modal.textarea.value = card.dataset.url || '';
      // 「modal.textarea.value = card.dataset.url || '';」: modal.textarea.valueの値を設定・更新する代入先
      modal.overlay.style.display = 'flex';
      // 「modal.overlay.style.display = 'flex';」: modal.overlay.style.displayの値を設定・更新する代入先
      modal.overlay.classList.add('is-open');
      // 「modal.overlay.classList.add('is-open');」: modal.overlay.classList.addを呼び出して必要な処理を実行する
      modal.textarea.focus();
      // 「modal.textarea.focus(【引数】);」: modal.textarea.focusを呼び出して必要な処理を実行する

      const onSave = () => {
      // 「const onSave = () =>;」: onSaveを保持する変数
        const nextUrl = modal.textarea.value.trim();
        // 「const nextUrl = modal.textarea.value.trim();」: nextUrlを保持する変数
        card.dataset.url = nextUrl;
        // 「card.dataset.url = nextUrl;」: card.dataset.urlの値を設定・更新する代入先
        const body = card.querySelector('.url-card-body');
        // 「const body = card.querySelector('.url-card-body');」: bodyを保持する変数
        if (body) {
        // 「if (【条件】)」: 【条件】を判定する条件分岐
          body.textContent = nextUrl;
          // 「body.textContent = nextUrl;」: body.textContentの値を設定・更新する代入先
        }
        modal.overlay.classList.remove('is-open');
        // 「modal.overlay.classList.remove('is-open');」: modal.overlay.classList.removeを呼び出して必要な処理を実行する
        modal.overlay.style.display = 'none';
        // 「modal.overlay.style.display = 'none';」: modal.overlay.style.displayの値を設定・更新する代入先
        modal.saveBtn.removeEventListener('click', onSave);
        // 「modal.saveBtn.removeEventListener('click', onSave);」: modal.saveBtn.removeEventListenerを呼び出して必要な処理を実行する
        modal.cancelBtn.removeEventListener('click', onCancel);
        // 「modal.cancelBtn.removeEventListener('click', onCancel);」: modal.cancelBtn.removeEventListenerを呼び出して必要な処理を実行する
        syncHiddenField();
        // 「syncHiddenField(【引数】);」: syncHiddenFieldを呼び出して必要な処理を実行する
      };
      const onCancel = () => {
      // 「const onCancel = () =>;」: onCancelを保持する変数
        modal.overlay.classList.remove('is-open');
        // 「modal.overlay.classList.remove('is-open');」: modal.overlay.classList.removeを呼び出して必要な処理を実行する
        modal.overlay.style.display = 'none';
        // 「modal.overlay.style.display = 'none';」: modal.overlay.style.displayの値を設定・更新する代入先
        modal.saveBtn.removeEventListener('click', onSave);
        // 「modal.saveBtn.removeEventListener('click', onSave);」: modal.saveBtn.removeEventListenerを呼び出して必要な処理を実行する
        modal.cancelBtn.removeEventListener('click', onCancel);
        // 「modal.cancelBtn.removeEventListener('click', onCancel);」: modal.cancelBtn.removeEventListenerを呼び出して必要な処理を実行する
      };

      modal.saveBtn.addEventListener('click', onSave);
      // 「modal.saveBtn.addEventListener('click', onSave);」: modal.saveBtn.addEventListenerを呼び出して必要な処理を実行する
      modal.cancelBtn.addEventListener('click', onCancel);
      // 「modal.cancelBtn.addEventListener('click', onCancel);」: modal.cancelBtn.addEventListenerを呼び出して必要な処理を実行する
    });

    card.querySelector('.card-delete-btn').addEventListener('click', (e) => {
      e.preventDefault();
      // 「e.preventDefault(【引数】);」: e.preventDefaultを呼び出して必要な処理を実行する
      e.stopPropagation();
      // 「e.stopPropagation(【引数】);」: e.stopPropagationを呼び出して必要な処理を実行する
      card.remove();
      // 「card.remove(【引数】);」: card.removeを呼び出して必要な処理を実行する
      syncHiddenField();
      // 「syncHiddenField(【引数】);」: syncHiddenFieldを呼び出して必要な処理を実行する
    });

    setCardMoveHandlers(card);
    // 「setCardMoveHandlers(card);」: setCardMoveHandlersを呼び出して必要な処理を実行する
    return card;
    // 「return card;」: 呼び出し元へcardの値を返して処理を終了する
  };

  const buildFormulaCard = (rawFormula) => {
  // 「const buildFormulaCard = (rawFormula) =>;」: buildFormulaCardを保持する変数
    const card = document.createElement('div');
    // 「const card = document.createElement('div');」: cardを保持する変数
    card.className = 'formula-card';
    // 「card.className = 'formula-card';」: card.classNameの値を設定・更新する代入先
    card.contentEditable = 'false';
    // 「card.contentEditable = 'false';」: card.contentEditableの値を設定・更新する代入先
    const formulaText = parseFormulaContent(rawFormula);
    // 「const formulaText = parseFormulaContent(rawFormula);」: formulaTextを保持する変数
    
    card.dataset.formula = formulaText;
    // 「card.dataset.formula = formulaText;」: card.dataset.formulaの値を設定・更新する代入先
    
    card.innerHTML = `<div class="formula-card-body">${escapeHtml(formulaText)}</div><button class="card-move-up-btn" type="button" contenteditable="false" style="position: absolute; top: 0; right: 110px; background: #6c757d; color: white; border: none; padding: 2px 6px; border-radius: 2px; font-size: 10px; cursor: pointer; z-index: 10;">上へ</button><button class="card-move-down-btn" type="button" contenteditable="false" style="position: absolute; top: 0; right: 74px; background: #6c757d; color: white; border: none; padding: 2px 6px; border-radius: 2px; font-size: 10px; cursor: pointer; z-index: 10;">下へ</button><button class="card-edit-btn" type="button" contenteditable="false" style="position: absolute; top: 0; right: 38px; background: #0d6efd; color: white; border: none; padding: 2px 6px; border-radius: 2px; font-size: 10px; cursor: pointer; z-index: 10;">編集</button><button class="card-delete-btn" type="button" contenteditable="false" style="position: absolute; top: 0; right: 2px; background: #dc3545; color: white; border: none; padding: 2px 6px; border-radius: 2px; font-size: 9px; cursor: pointer; z-index: 10;">削除</button>`;
    // 「card.innerHTML = `<div class="formula-card-body">${escapeHtml(formulaText)}</div><button class="card-move-up-btn" type="button" contenteditable="false" style="position: absolute; top: 0; right: 110px; background: #6c757d; color: white; border: none; padding: 2px 6px; border-radius: 2px; font-size: 10px; cursor: pointer; z-index: 10;">上へ</button><button class="card-move-down-btn" type="button" contenteditable="false" style="position: absolute; top: 0; right: 74px; background: #6c757d; color: white; border: none; padding: 2px 6px; border-radius: 2px; font-size: 10px; cursor: pointer; z-index: 10;">下へ</button><button class="card-edit-btn" type="button" contenteditable="false" style="position: absolute; top: 0; right: 38px; background: #0d6efd; color: white; border: none; padding: 2px 6px; border-radius: 2px; font-size: 10px; cursor: pointer; z-index: 10;">編集</button><button class="card-delete-btn" type="button" contenteditable="false" style="position: absolute; top: 0; right: 2px; background: #dc3545; color: white; border: none; padding: 2px 6px; border-radius: 2px; font-size: 9px; cursor: pointer; z-index: 10;">削除</button>`;」: card.innerHTMLの値を設定・更新する代入先

    const editBtn = card.querySelector('.card-edit-btn');
    // 「const editBtn = card.querySelector('.card-edit-btn');」: editBtnを保持する変数
    editBtn.addEventListener('click', (e) => {
      e.preventDefault();
      // 「e.preventDefault(【引数】);」: e.preventDefaultを呼び出して必要な処理を実行する
      e.stopPropagation();
      // 「e.stopPropagation(【引数】);」: e.stopPropagationを呼び出して必要な処理を実行する
      const modal = ensureFormulaModal();
      // 「const modal = ensureFormulaModal();」: modalを保持する変数
      modal.textarea.value = card.dataset.formula || '';
      // 「modal.textarea.value = card.dataset.formula || '';」: modal.textarea.valueの値を設定・更新する代入先
      if (modal.overlay) {
      // 「if (【条件】)」: 【条件】を判定する条件分岐
        modal.overlay.style.display = 'flex';
        // 「modal.overlay.style.display = 'flex';」: modal.overlay.style.displayの値を設定・更新する代入先
        modal.overlay.classList.add('is-open');
        // 「modal.overlay.classList.add('is-open');」: modal.overlay.classList.addを呼び出して必要な処理を実行する
      }
      modal.textarea.focus();
      // 「modal.textarea.focus(【引数】);」: modal.textarea.focusを呼び出して必要な処理を実行する

      const oldSaveBtn = modal.saveBtn.cloneNode(true);
      // 「const oldSaveBtn = modal.saveBtn.cloneNode(true);」: oldSaveBtnを保持する変数
      const oldCancelBtn = modal.cancelBtn.cloneNode(true);
      // 「const oldCancelBtn = modal.cancelBtn.cloneNode(true);」: oldCancelBtnを保持する変数
      modal.saveBtn.parentNode.replaceChild(oldSaveBtn, modal.saveBtn);
      // 「modal.saveBtn.parentNode.replaceChild(oldSaveBtn, modal.saveBtn);」: modal.saveBtn.parentNode.replaceChildを呼び出して必要な処理を実行する
      modal.cancelBtn.parentNode.replaceChild(oldCancelBtn, modal.cancelBtn);
      // 「modal.cancelBtn.parentNode.replaceChild(oldCancelBtn, modal.cancelBtn);」: modal.cancelBtn.parentNode.replaceChildを呼び出して必要な処理を実行する
      const newModal = { ...modal, saveBtn: oldSaveBtn, cancelBtn: oldCancelBtn };
      // 「const newModal = { ...modal, saveBtn: oldSaveBtn, cancelBtn: oldCancelBtn };」: newModalを保持する変数

      const onSave = () => {
      // 「const onSave = () =>;」: onSaveを保持する変数
        card.dataset.formula = newModal.textarea.value;
        // 「card.dataset.formula = newModal.textarea.value;」: card.dataset.formulaの値を設定・更新する代入先
        const body = card.querySelector('.formula-card-body');
        // 「const body = card.querySelector('.formula-card-body');」: bodyを保持する変数
        if (body) body.textContent = newModal.textarea.value;
        // 「if (【条件】)」: 【条件】を判定する条件分岐
        if (newModal.overlay) {
        // 「if (【条件】)」: 【条件】を判定する条件分岐
          newModal.overlay.classList.remove('is-open');
          // 「newModal.overlay.classList.remove('is-open');」: newModal.overlay.classList.removeを呼び出して必要な処理を実行する
          newModal.overlay.style.display = 'none';
          // 「newModal.overlay.style.display = 'none';」: newModal.overlay.style.displayの値を設定・更新する代入先
        }
        syncHiddenField();
        // 「syncHiddenField(【引数】);」: syncHiddenFieldを呼び出して必要な処理を実行する
      };
      const onCancel = () => {
      // 「const onCancel = () =>;」: onCancelを保持する変数
        if (newModal.overlay) {
        // 「if (【条件】)」: 【条件】を判定する条件分岐
          newModal.overlay.classList.remove('is-open');
          // 「newModal.overlay.classList.remove('is-open');」: newModal.overlay.classList.removeを呼び出して必要な処理を実行する
          newModal.overlay.style.display = 'none';
          // 「newModal.overlay.style.display = 'none';」: newModal.overlay.style.displayの値を設定・更新する代入先
        }
      };

      newModal.saveBtn.addEventListener('click', onSave);
      // 「newModal.saveBtn.addEventListener('click', onSave);」: newModal.saveBtn.addEventListenerを呼び出して必要な処理を実行する
      newModal.cancelBtn.addEventListener('click', onCancel);
      // 「newModal.cancelBtn.addEventListener('click', onCancel);」: newModal.cancelBtn.addEventListenerを呼び出して必要な処理を実行する
    });

    card.querySelector('.card-delete-btn').addEventListener('click', (e) => {
      e.preventDefault();
      // 「e.preventDefault(【引数】);」: e.preventDefaultを呼び出して必要な処理を実行する
      e.stopPropagation();
      // 「e.stopPropagation(【引数】);」: e.stopPropagationを呼び出して必要な処理を実行する
      card.remove();
      // 「card.remove(【引数】);」: card.removeを呼び出して必要な処理を実行する
      syncHiddenField();
      // 「syncHiddenField(【引数】);」: syncHiddenFieldを呼び出して必要な処理を実行する
    });

    setCardMoveHandlers(card);
    // 「setCardMoveHandlers(card);」: setCardMoveHandlersを呼び出して必要な処理を実行する

    return card;
    // 「return card;」: 呼び出し元へcardの値を返して処理を終了する
  };

  const buildCodeCard = (rawCode) => {
  // 「const buildCodeCard = (rawCode) =>;」: buildCodeCardを保持する変数
    const card = document.createElement('div');
    // 「const card = document.createElement('div');」: cardを保持する変数
    card.className = 'code-card';
    // 「card.className = 'code-card';」: card.classNameの値を設定・更新する代入先
    card.contentEditable = 'false';
    // 「card.contentEditable = 'false';」: card.contentEditableの値を設定・更新する代入先
    const parsed = parseCodeContent(rawCode);
    // 「const parsed = parseCodeContent(rawCode);」: parsedを保持する変数
    card.dataset.lang = parsed.lang;
    // 「card.dataset.lang = parsed.lang;」: card.dataset.langの値を設定・更新する代入先
    card.dataset.code = parsed.code;
    // 「card.dataset.code = parsed.code;」: card.dataset.codeの値を設定・更新する代入先
    const preview = getCodePreview(parsed.code);
    // 「const preview = getCodePreview(parsed.code);」: previewを保持する変数
    card.innerHTML = `<pre class="code-card-body">${escapeHtml(preview)}</pre><button class="card-move-up-btn" type="button" contenteditable="false" style="position: absolute; top: 0; right: 110px; background: #6c757d; color: white; border: none; padding: 2px 6px; border-radius: 2px; font-size: 10px; cursor: pointer;">上へ</button><button class="card-move-down-btn" type="button" contenteditable="false" style="position: absolute; top: 0; right: 74px; background: #6c757d; color: white; border: none; padding: 2px 6px; border-radius: 2px; font-size: 10px; cursor: pointer;">下へ</button><button class="card-edit-btn" type="button" contenteditable="false" style="position: absolute; top: 0; right: 38px; background: #0d6efd; color: white; border: none; padding: 2px 6px; border-radius: 2px; font-size: 10px; cursor: pointer;">編集</button><button class="card-delete-btn" type="button" contenteditable="false" style="position: absolute; top: 0; right: 2px; background: #dc3545; color: white; border: none; padding: 2px 6px; border-radius: 2px; font-size: 9px; cursor: pointer;">削除</button>`;
    // 「card.innerHTML = `<pre class="code-card-body">${escapeHtml(preview)}</pre><button class="card-move-up-btn" type="button" contenteditable="false" style="position: absolute; top: 0; right: 110px; background: #6c757d; color: white; border: none; padding: 2px 6px; border-radius: 2px; font-size: 10px; cursor: pointer;">上へ</button><button class="card-move-down-btn" type="button" contenteditable="false" style="position: absolute; top: 0; right: 74px; background: #6c757d; color: white; border: none; padding: 2px 6px; border-radius: 2px; font-size: 10px; cursor: pointer;">下へ</button><button class="card-edit-btn" type="button" contenteditable="false" style="position: absolute; top: 0; right: 38px; background: #0d6efd; color: white; border: none; padding: 2px 6px; border-radius: 2px; font-size: 10px; cursor: pointer;">編集</button><button class="card-delete-btn" type="button" contenteditable="false" style="position: absolute; top: 0; right: 2px; background: #dc3545; color: white; border: none; padding: 2px 6px; border-radius: 2px; font-size: 9px; cursor: pointer;">削除</button>`;」: card.innerHTMLの値を設定・更新する代入先

    const editBtn = card.querySelector('.card-edit-btn');
    // 「const editBtn = card.querySelector('.card-edit-btn');」: editBtnを保持する変数
    editBtn.addEventListener('click', (e) => {
      e.preventDefault();
      // 「e.preventDefault(【引数】);」: e.preventDefaultを呼び出して必要な処理を実行する
      e.stopPropagation();
      // 「e.stopPropagation(【引数】);」: e.stopPropagationを呼び出して必要な処理を実行する
      const modal = ensureCodeModal();
      // 「const modal = ensureCodeModal();」: modalを保持する変数
      const currentCode = card.dataset.code || '';
      // 「const currentCode = card.dataset.code || '';」: currentCodeを保持する変数
      modal.textarea.value = currentCode;
      // 「modal.textarea.value = currentCode;」: modal.textarea.valueの値を設定・更新する代入先
      if (modal.overlay) {
      // 「if (【条件】)」: 【条件】を判定する条件分岐
        modal.overlay.style.display = 'flex';
        // 「modal.overlay.style.display = 'flex';」: modal.overlay.style.displayの値を設定・更新する代入先
        modal.overlay.classList.add('is-open');
        // 「modal.overlay.classList.add('is-open');」: modal.overlay.classList.addを呼び出して必要な処理を実行する
      }
      modal.textarea.focus();
      // 「modal.textarea.focus(【引数】);」: modal.textarea.focusを呼び出して必要な処理を実行する

      const onSave = () => {
      // 「const onSave = () =>;」: onSaveを保持する変数
        card.dataset.code = modal.textarea.value;
        // 「card.dataset.code = modal.textarea.value;」: card.dataset.codeの値を設定・更新する代入先
        const pre = card.querySelector('pre');
        // 「const pre = card.querySelector('pre');」: preを保持する変数
        if (pre) pre.textContent = modal.textarea.value;
        // 「if (【条件】)」: 【条件】を判定する条件分岐
        if (modal.overlay) {
        // 「if (【条件】)」: 【条件】を判定する条件分岐
          modal.overlay.classList.remove('is-open');
          // 「modal.overlay.classList.remove('is-open');」: modal.overlay.classList.removeを呼び出して必要な処理を実行する
          modal.overlay.style.display = 'none';
          // 「modal.overlay.style.display = 'none';」: modal.overlay.style.displayの値を設定・更新する代入先
        }
        syncHiddenField();
        // 「syncHiddenField(【引数】);」: syncHiddenFieldを呼び出して必要な処理を実行する
        if (modal.saveBtn) modal.saveBtn.removeEventListener('click', onSave);
        // 「if (【条件】)」: 【条件】を判定する条件分岐
        if (modal.cancelBtn) modal.cancelBtn.removeEventListener('click', onCancel);
        // 「if (【条件】)」: 【条件】を判定する条件分岐
      };
      const onCancel = () => {
      // 「const onCancel = () =>;」: onCancelを保持する変数
        if (modal.overlay) {
        // 「if (【条件】)」: 【条件】を判定する条件分岐
          modal.overlay.classList.remove('is-open');
          // 「modal.overlay.classList.remove('is-open');」: modal.overlay.classList.removeを呼び出して必要な処理を実行する
          modal.overlay.style.display = 'none';
          // 「modal.overlay.style.display = 'none';」: modal.overlay.style.displayの値を設定・更新する代入先
        }
        if (modal.saveBtn) modal.saveBtn.removeEventListener('click', onSave);
        // 「if (【条件】)」: 【条件】を判定する条件分岐
        if (modal.cancelBtn) modal.cancelBtn.removeEventListener('click', onCancel);
        // 「if (【条件】)」: 【条件】を判定する条件分岐
      };

      modal.saveBtn.addEventListener('click', onSave);
      // 「modal.saveBtn.addEventListener('click', onSave);」: modal.saveBtn.addEventListenerを呼び出して必要な処理を実行する
      modal.cancelBtn.addEventListener('click', onCancel);
      // 「modal.cancelBtn.addEventListener('click', onCancel);」: modal.cancelBtn.addEventListenerを呼び出して必要な処理を実行する
    });

    card.querySelector('.card-delete-btn').addEventListener('click', (e) => {
      e.preventDefault();
      // 「e.preventDefault(【引数】);」: e.preventDefaultを呼び出して必要な処理を実行する
      e.stopPropagation();
      // 「e.stopPropagation(【引数】);」: e.stopPropagationを呼び出して必要な処理を実行する
      card.remove();
      // 「card.remove(【引数】);」: card.removeを呼び出して必要な処理を実行する
      syncHiddenField();
      // 「syncHiddenField(【引数】);」: syncHiddenFieldを呼び出して必要な処理を実行する
    });

    setCardMoveHandlers(card);
    // 「setCardMoveHandlers(card);」: setCardMoveHandlersを呼び出して必要な処理を実行する

    return card;
    // 「return card;」: 呼び出し元へcardの値を返して処理を終了する
  };

  // ========== マークダウン記法をリアルタイムでカード化 ==========
  const processEditorContent = () => {
    // 手順0：既存のBR や 無関係な DIV/P をtext-lineでラップ
    const wrapLooseContent = () => {
    // 「const wrapLooseContent = () =>;」: wrapLooseContentを保持する変数
      Array.from(bodyEditor.childNodes).forEach((node) => {
        if (node.nodeType === 1) { // Element node
        // 「if (【条件】)」: 【条件】を判定する条件分岐
          if (node.tagName === 'BR') {
            // <br> を text-line でラップ
            const textLine = document.createElement('div');
            // 「const textLine = document.createElement('div');」: textLineを保持する変数
            textLine.className = 'text-line';
            // 「textLine.className = 'text-line';」: textLine.classNameの値を設定・更新する代入先
            textLine.contentEditable = 'true';
            // 「textLine.contentEditable = 'true';」: textLine.contentEditableの値を設定・更新する代入先
            textLine.appendChild(document.createTextNode('\u200b'));
            // 「textLine.appendChild(document.createTextNode('\u200b'));」: textLine.appendChildを呼び出して必要な処理を実行する
            node.replaceWith(textLine);
            // 「node.replaceWith(textLine);」: node.replaceWithを呼び出して必要な処理を実行する
          } else if ((node.tagName === 'DIV' || node.tagName === 'P') && 
          // 「else if (【条件】)」: 前条件が偽の場合に【条件】を追加判定する分岐
                     !node.classList?.contains('text-line') &&
                     !node.classList?.contains('media-card') && 
                     !node.classList?.contains('code-card') &&
                     !node.classList?.contains('formula-card')) {
            // 無関係な DIV/P を text-line に変換（内容を保持）
            const textLine = document.createElement('div');
            // 「const textLine = document.createElement('div');」: textLineを保持する変数
            textLine.className = 'text-line';
            // 「textLine.className = 'text-line';」: textLine.classNameの値を設定・更新する代入先
            textLine.contentEditable = 'true';
            // 「textLine.contentEditable = 'true';」: textLine.contentEditableの値を設定・更新する代入先
            while (node.firstChild) {
            // 「while (【条件】)」: 【条件】が真の間だけ繰り返すループ
              textLine.appendChild(node.firstChild);
              // 「textLine.appendChild(node.firstChild);」: textLine.appendChildを呼び出して必要な処理を実行する
            }
            if (textLine.childNodes.length === 0) {
            // 「if (【条件】)」: 【条件】を判定する条件分岐
              textLine.appendChild(document.createTextNode('\u200b'));
              // 「textLine.appendChild(document.createTextNode('\u200b'));」: textLine.appendChildを呼び出して必要な処理を実行する
            }
            node.replaceWith(textLine);
            // 「node.replaceWith(textLine);」: node.replaceWithを呼び出して必要な処理を実行する
          } else if (node.tagName === 'PRE') {
          // 「else if (【条件】)」: 前条件が偽の場合に【条件】を追加判定する分岐
            const preText = node.textContent || '';
            // 「const preText = node.textContent || '';」: preTextを保持する変数
            const raw = `\n\n\u0060\u0060\u0060\n${preText}\n\u0060\u0060\u0060\n`;
            // 「const raw = `\n\n\u0060\u0060\u0060\n${preText}\n\u0060\u0060\u0060\n`;」: rawを保持する変数
            const codeCard = buildCodeCard(raw);
            // 「const codeCard = buildCodeCard(raw);」: codeCardを保持する変数
            node.parentNode.replaceChild(codeCard, node);
            // 「node.parentNode.replaceChild(codeCard, node);」: node.parentNode.replaceChildを呼び出して必要な処理を実行する
          }
        } else if (node.nodeType === 3) { // Text node
          // 手前のノードと後ろのノードを見て、テキストノードを text-line でラップするか判定
          if (node.data.trim() !== '') {
          // 「if (【条件】)」: 【条件】を判定する条件分岐
            const textLine = document.createElement('div');
            // 「const textLine = document.createElement('div');」: textLineを保持する変数
            textLine.className = 'text-line';
            // 「textLine.className = 'text-line';」: textLine.classNameの値を設定・更新する代入先
            textLine.contentEditable = 'true';
            // 「textLine.contentEditable = 'true';」: textLine.contentEditableの値を設定・更新する代入先
            textLine.appendChild(document.createTextNode(node.data));
            // 「textLine.appendChild(document.createTextNode(node.data));」: textLine.appendChildを呼び出して必要な処理を実行する
            node.replaceWith(textLine);
            // 「node.replaceWith(textLine);」: node.replaceWithを呼び出して必要な処理を実行する
          }
        }
      });
    };
    wrapLooseContent();
    // 「wrapLooseContent(【引数】);」: wrapLooseContentを呼び出して必要な処理を実行する

    bodyEditor.normalize();
    // 「bodyEditor.normalize(【引数】);」: bodyEditor.normalizeを呼び出して必要な処理を実行する

    const childNodes = Array.from(bodyEditor.childNodes);
    // 「const childNodes = Array.from(bodyEditor.childNodes);」: childNodesを保持する変数
    
    const combinedRegex = /(!\[([^\]]*)\]\(image:([^\)]+)\))|(```[\s\S]*?```)|(``formula[\s\S]*?``)|(\[\[sn-code:[A-Za-z0-9+\/=]+\]\])|(\[\[sn-formula:[A-Za-z0-9+\/=]+\]\])|(\[\[sn-text:[A-Za-z0-9+\/=]+\]\])|(\[\[sn-url:[A-Za-z0-9+\/=]+\]\])/g;
    // 「const combinedRegex = /(!\[([^\]]*)\]\(image:([^\)]+)\))|(```[\s\S]*?```)|(``formula[\s\S]*?``)|(\[\[sn-code:[A-Za-z0-9+\/=]+\]\])|(\[\[sn-formula:[A-Za-z0-9+\/=]+\]\])|(\[\[sn-text:[A-Za-z0-9+\/=]+\]\])|(\[\[sn-url:[A-Za-z0-9+\/=]+\]\])/g;」: combinedRegexを保持する変数

    const replaceBufferedNodes = (bufferNodes, bufferText) => {
    // 「const replaceBufferedNodes = (bufferNodes, bufferText) =>;」: replaceBufferedNodesを保持する変数
      combinedRegex.lastIndex = 0;
      // 「combinedRegex.lastIndex = 0;」: combinedRegex.lastIndexの値を設定・更新する代入先
      
      if (!bufferNodes.length) return;
      // 「if (【条件】)」: 【条件】を判定する条件分岐
      combinedRegex.lastIndex = 0;
      // 「combinedRegex.lastIndex = 0;」: combinedRegex.lastIndexの値を設定・更新する代入先
      if (!combinedRegex.test(bufferText)) {
      // 「if (【条件】)」: 【条件】を判定する条件分岐
        const plainTextOnly = (bufferText || '').trim();
        // 「const plainTextOnly = (bufferText || '').trim();」: plainTextOnlyを保持する変数
        if (!plainTextOnly) return;
        // 「if (【条件】)」: 【条件】を判定する条件分岐

        const fragment = document.createDocumentFragment();
        // 「const fragment = document.createDocumentFragment();」: fragmentを保持する変数
        fragment.appendChild(document.createTextNode('\u200b'));
        // 「fragment.appendChild(document.createTextNode('\u200b'));」: fragment.appendChildを呼び出して必要な処理を実行する
        fragment.appendChild(buildTextCard(serializeTextCard(plainTextOnly)));
        // 「fragment.appendChild(buildTextCard(serializeTextCard(plainTextOnly)));」: fragment.appendChildを呼び出して必要な処理を実行する
        fragment.appendChild(document.createTextNode('\u200b'));
        // 「fragment.appendChild(document.createTextNode('\u200b'));」: fragment.appendChildを呼び出して必要な処理を実行する

        const first = bufferNodes[0];
        // 「const first = bufferNodes[0];」: firstを保持する変数
        first.parentNode.replaceChild(fragment, first);
        // 「first.parentNode.replaceChild(fragment, first);」: first.parentNode.replaceChildを呼び出して必要な処理を実行する
        bufferNodes.slice(1).forEach((n) => n.remove());
        // 「bufferNodes.slice(1).forEach((n) => n.remove());」: bufferNodes.sliceを呼び出して必要な処理を実行する
        return;
        // 「return 【値】;」: 呼び出し元へ【値】の値を返して処理を終了する
      }
      combinedRegex.lastIndex = 0;
      // 「combinedRegex.lastIndex = 0;」: combinedRegex.lastIndexの値を設定・更新する代入先
      const fragment = document.createDocumentFragment();
      // 「const fragment = document.createDocumentFragment();」: fragmentを保持する変数
      let lastIndex = 0;
      // 「let lastIndex = 0;」: lastIndexを保持する変数
      let match;

      while ((match = combinedRegex.exec(bufferText))) {
      // 「while (【条件】)」: 【条件】が真の間だけ繰り返すループ
        if (match.index > lastIndex) {
        // 「if (【条件】)」: 【条件】を判定する条件分岐
          const plainText = bufferText.substring(lastIndex, match.index).trim();
          // 「const plainText = bufferText.substring(lastIndex, match.index).trim();」: plainTextを保持する変数
          if (plainText) {
          // 「if (【条件】)」: 【条件】を判定する条件分岐
            fragment.appendChild(document.createTextNode('\u200b'));
            // 「fragment.appendChild(document.createTextNode('\u200b'));」: fragment.appendChildを呼び出して必要な処理を実行する
            fragment.appendChild(buildTextCard(serializeTextCard(plainText)));
            // 「fragment.appendChild(buildTextCard(serializeTextCard(plainText)));」: fragment.appendChildを呼び出して必要な処理を実行する
            fragment.appendChild(document.createTextNode('\u200b'));
            // 「fragment.appendChild(document.createTextNode('\u200b'));」: fragment.appendChildを呼び出して必要な処理を実行する
          }
        }

        if (match[1]) {
        // 「if (【条件】)」: 【条件】を判定する条件分岐
          const alt = match[2];
          // 「const alt = match[2];」: altを保持する変数
          const filename = match[3];
          // 「const filename = match[3];」: filenameを保持する変数
          const spacer = document.createElement('span');
          // 「const spacer = document.createElement('span');」: spacerを保持する変数
          spacer.className = 'card-spacer';
          // 「spacer.className = 'card-spacer';」: spacer.classNameの値を設定・更新する代入先
          spacer.contentEditable = 'false';
          // 「spacer.contentEditable = 'false';」: spacer.contentEditableの値を設定・更新する代入先

          const card = document.createElement('div');
          // 「const card = document.createElement('div');」: cardを保持する変数
          card.className = 'media-card';
          // 「card.className = 'media-card';」: card.classNameの値を設定・更新する代入先
          card.contentEditable = 'false';
          // 「card.contentEditable = 'false';」: card.contentEditableの値を設定・更新する代入先
          card.innerHTML = `
          // 「card.innerHTML = `;」: card.innerHTMLの値を設定・更新する代入先
            <img src="/images/placeholder.png" alt="${alt || '画像'}" data-filename="${filename}" loading="lazy">
            <div class="filename">${filename}</div>
            <button class="card-move-up-btn" type="button" contenteditable="false" style="position: absolute; top: 0; right: 74px; background: #6c757d; color: white; border: none; padding: 2px 6px; border-radius: 2px; font-size: 10px; cursor: pointer;">上へ</button>
            <button class="card-move-down-btn" type="button" contenteditable="false" style="position: absolute; top: 0; right: 38px; background: #6c757d; color: white; border: none; padding: 2px 6px; border-radius: 2px; font-size: 10px; cursor: pointer;">下へ</button>
            <button class="card-delete-btn" type="button">削除</button>
          `;

          const img = card.querySelector('img');
          // 「const img = card.querySelector('img');」: imgを保持する変数
          if (localImageUrlMap.has(filename)) {
          // 「if (【条件】)」: 【条件】を判定する条件分岐
            img.src = localImageUrlMap.get(filename);
            // 「img.src = localImageUrlMap.get(filename);」: img.srcの値を設定・更新する代入先
          } else if (window.imageUrlMap && window.imageUrlMap[filename]) {
          // 「else if (【条件】)」: 前条件が偽の場合に【条件】を追加判定する分岐
            img.src = window.imageUrlMap[filename];
            // 「img.src = window.imageUrlMap[filename];」: img.srcの値を設定・更新する代入先
          } else {
          // 「else」: 上記条件に当てはまらない場合の分岐
            fetch(`/posts/image_url?filename=${encodeURIComponent(filename)}`)
              .then((response) => response.json())
              .then((data) => {
                if (data.url) img.src = data.url;
                // 「if (【条件】)」: 【条件】を判定する条件分岐
              })
              .catch(() => {});
          }

          card.querySelector('.card-delete-btn').addEventListener('click', (e) => {
            e.preventDefault();
            // 「e.preventDefault(【引数】);」: e.preventDefaultを呼び出して必要な処理を実行する
            e.stopPropagation();
            // 「e.stopPropagation(【引数】);」: e.stopPropagationを呼び出して必要な処理を実行する
            card.remove();
            // 「card.remove(【引数】);」: card.removeを呼び出して必要な処理を実行する
            syncHiddenField();
            // 「syncHiddenField(【引数】);」: syncHiddenFieldを呼び出して必要な処理を実行する
          });

          setCardMoveHandlers(card);
          // 「setCardMoveHandlers(card);」: setCardMoveHandlersを呼び出して必要な処理を実行する

          fragment.appendChild(spacer);
          // 「fragment.appendChild(spacer);」: fragment.appendChildを呼び出して必要な処理を実行する
          fragment.appendChild(card);
          // 「fragment.appendChild(card);」: fragment.appendChildを呼び出して必要な処理を実行する
        } else if (match[4] || match[6]) {
        // 「else if (【条件】)」: 前条件が偽の場合に【条件】を追加判定する分岐
          const codeContent = match[4] || match[6];
          // 「const codeContent = match[4] || match[6];」: codeContentを保持する変数
          fragment.appendChild(document.createTextNode('\u200b'));
          // 「fragment.appendChild(document.createTextNode('\u200b'));」: fragment.appendChildを呼び出して必要な処理を実行する
          const card = buildCodeCard(codeContent);
          // 「const card = buildCodeCard(codeContent);」: cardを保持する変数
          fragment.appendChild(card);
          // 「fragment.appendChild(card);」: fragment.appendChildを呼び出して必要な処理を実行する
          fragment.appendChild(document.createTextNode('\u200b'));
          // 「fragment.appendChild(document.createTextNode('\u200b'));」: fragment.appendChildを呼び出して必要な処理を実行する
        } else if (match[5] || match[7]) {
        // 「else if (【条件】)」: 前条件が偽の場合に【条件】を追加判定する分岐
          const formulaContent = match[5] || match[7];
          // 「const formulaContent = match[5] || match[7];」: formulaContentを保持する変数
          fragment.appendChild(document.createTextNode('\u200b'));
          // 「fragment.appendChild(document.createTextNode('\u200b'));」: fragment.appendChildを呼び出して必要な処理を実行する
          const card = buildFormulaCard(formulaContent);
          // 「const card = buildFormulaCard(formulaContent);」: cardを保持する変数
          fragment.appendChild(card);
          // 「fragment.appendChild(card);」: fragment.appendChildを呼び出して必要な処理を実行する
          fragment.appendChild(document.createTextNode('\u200b'));
          // 「fragment.appendChild(document.createTextNode('\u200b'));」: fragment.appendChildを呼び出して必要な処理を実行する
        } else if (match[8]) {
        // 「else if (【条件】)」: 前条件が偽の場合に【条件】を追加判定する分岐
          fragment.appendChild(document.createTextNode('\u200b'));
          // 「fragment.appendChild(document.createTextNode('\u200b'));」: fragment.appendChildを呼び出して必要な処理を実行する
          fragment.appendChild(buildTextCard(match[8]));
          // 「fragment.appendChild(buildTextCard(match[8]));」: fragment.appendChildを呼び出して必要な処理を実行する
          fragment.appendChild(document.createTextNode('\u200b'));
          // 「fragment.appendChild(document.createTextNode('\u200b'));」: fragment.appendChildを呼び出して必要な処理を実行する
        } else if (match[9]) {
        // 「else if (【条件】)」: 前条件が偽の場合に【条件】を追加判定する分岐
          fragment.appendChild(document.createTextNode('\u200b'));
          // 「fragment.appendChild(document.createTextNode('\u200b'));」: fragment.appendChildを呼び出して必要な処理を実行する
          fragment.appendChild(buildUrlCard(match[9]));
          // 「fragment.appendChild(buildUrlCard(match[9]));」: fragment.appendChildを呼び出して必要な処理を実行する
          fragment.appendChild(document.createTextNode('\u200b'));
          // 「fragment.appendChild(document.createTextNode('\u200b'));」: fragment.appendChildを呼び出して必要な処理を実行する
        }

        lastIndex = combinedRegex.lastIndex;
        // 「lastIndex = combinedRegex.lastIndex;」: lastIndexの値を設定・更新する代入先
      }

      if (lastIndex < bufferText.length) {
      // 「if (【条件】)」: 【条件】を判定する条件分岐
        const plainText = bufferText.substring(lastIndex).trim();
        // 「const plainText = bufferText.substring(lastIndex).trim();」: plainTextを保持する変数
        if (plainText) {
        // 「if (【条件】)」: 【条件】を判定する条件分岐
          fragment.appendChild(document.createTextNode('\u200b'));
          // 「fragment.appendChild(document.createTextNode('\u200b'));」: fragment.appendChildを呼び出して必要な処理を実行する
          fragment.appendChild(buildTextCard(serializeTextCard(plainText)));
          // 「fragment.appendChild(buildTextCard(serializeTextCard(plainText)));」: fragment.appendChildを呼び出して必要な処理を実行する
          fragment.appendChild(document.createTextNode('\u200b'));
          // 「fragment.appendChild(document.createTextNode('\u200b'));」: fragment.appendChildを呼び出して必要な処理を実行する
        }
      }

      const first = bufferNodes[0];
      // 「const first = bufferNodes[0];」: firstを保持する変数
      first.parentNode.replaceChild(fragment, first);
      // 「first.parentNode.replaceChild(fragment, first);」: first.parentNode.replaceChildを呼び出して必要な処理を実行する
      bufferNodes.slice(1).forEach((n) => n.remove());
      // 「bufferNodes.slice(1).forEach((n) => n.remove());」: bufferNodes.sliceを呼び出して必要な処理を実行する
    };
    let bufferNodes = [];
    // 「let bufferNodes = [];」: bufferNodesを保持する変数
    let bufferText = '';
    // 「let bufferText = '';」: bufferTextを保持する変数

    childNodes.forEach((node) => {
      if (node.classList?.contains('media-card') || node.classList?.contains('code-card') || node.classList?.contains('formula-card') || node.classList?.contains('text-card') || node.classList?.contains('url-card')) {
      // 「if (【条件】)」: 【条件】を判定する条件分岐
        replaceBufferedNodes(bufferNodes, bufferText);
        // 「replaceBufferedNodes(bufferNodes, bufferText);」: replaceBufferedNodesを呼び出して必要な処理を実行する
        bufferNodes = [];
        // 「bufferNodes = [];」: bufferNodesの値を設定・更新する代入先
        bufferText = '';
        // 「bufferText = '';」: bufferTextの値を設定・更新する代入先
        return;
        // 「return 【値】;」: 呼び出し元へ【値】の値を返して処理を終了する
      }

      bufferNodes.push(node);
      // 「bufferNodes.push(node);」: bufferNodes.pushを呼び出して必要な処理を実行する

      if (node.nodeType === 3) {
      // 「if (【条件】)」: 【条件】を判定する条件分岐
        bufferText += (node.nodeValue || '').replace(/\u200b/g, '');
      } else if (node.nodeType === 1) {
      // 「else if (【条件】)」: 前条件が偽の場合に【条件】を追加判定する分岐
        bufferText += node.textContent || '';
      }
    });

    replaceBufferedNodes(bufferNodes, bufferText);
    // 「replaceBufferedNodes(bufferNodes, bufferText);」: replaceBufferedNodesを呼び出して必要な処理を実行する
  };

  const syncHiddenField = () => {
  // 「const syncHiddenField = () =>;」: syncHiddenFieldを保持する変数
    let text = '';
    // 「let text = '';」: textを保持する変数

    const isCardNode = (node) => {
    // 「const isCardNode = (node) =>;」: isCardNodeを保持する変数
      return !!(node && node.nodeType === 1 && node.classList &&
      // 「return !!(node && node.nodeType === 1 && node.classList &&;」: 呼び出し元へ!!(node && node.nodeType === 1 && node.classList &&の値を返して処理を終了する
        (node.classList.contains('media-card') ||
         node.classList.contains('code-card') ||
         node.classList.contains('formula-card') ||
         node.classList.contains('text-card') ||
         node.classList.contains('url-card')));
         // 「node.classList.contains('url-card')));」: node.classList.containsを呼び出して必要な処理を実行する
    };

    const appendBlock = (blockText) => {
    // 「const appendBlock = (blockText) =>;」: appendBlockを保持する変数
      if (text && !text.endsWith('\n')) {
      // 「if (【条件】)」: 【条件】を判定する条件分岐
        text += '\n';
      }
      text += blockText;
      if (!text.endsWith('\n')) {
      // 「if (【条件】)」: 【条件】を判定する条件分岐
        text += '\n';
      }
    };

    Array.from(bodyEditor.childNodes).forEach((node) => {
      if (node.nodeType === 1) {
        // Element node
        if (node.classList?.contains('card-spacer')) {
          // card-spacer はスキップ
          return;
          // 「return 【値】;」: 呼び出し元へ【値】の値を返して処理を終了する
        } else if (node.classList?.contains('media-card')) {
        // 「else if (【条件】)」: 前条件が偽の場合に【条件】を追加判定する分岐
          const filename = node.querySelector('.filename')?.textContent || '';
          // 「const filename = node.querySelector('.filename')?.textContent || '';」: filenameを保持する変数
          appendBlock(`![説明](image:${filename})`);
          // 「appendBlock(`![説明](image:${filename})`);」: appendBlockを呼び出して必要な処理を実行する
        } else if (node.classList?.contains('text-card')) {
        // 「else if (【条件】)」: 前条件が偽の場合に【条件】を追加判定する分岐
          const textCardText = node.dataset?.text || '';
          // 「const textCardText = node.dataset?.text || '';」: textCardTextを保持する変数
          appendBlock(serializeTextCard(textCardText));
          // 「appendBlock(serializeTextCard(textCardText));」: appendBlockを呼び出して必要な処理を実行する
        } else if (node.classList?.contains('url-card')) {
        // 「else if (【条件】)」: 前条件が偽の場合に【条件】を追加判定する分岐
          const url = node.dataset?.url || '';
          // 「const url = node.dataset?.url || '';」: urlを保持する変数
          appendBlock(serializeUrlCard(url));
          // 「appendBlock(serializeUrlCard(url));」: appendBlockを呼び出して必要な処理を実行する
        } else if (node.classList?.contains('code-card')) {
        // 「else if (【条件】)」: 前条件が偽の場合に【条件】を追加判定する分岐
          const pre = node.querySelector('pre');
          // 「const pre = node.querySelector('pre');」: preを保持する変数
          const lang = node.dataset?.lang || '';
          // 「const lang = node.dataset?.lang || '';」: langを保持する変数
          const codeText = node.dataset?.code ?? (pre ? pre.textContent : '');
          // 「const codeText = node.dataset?.code ?? (pre ? pre.textContent : '');」: codeTextを保持する変数
          appendBlock(serializeCodeCard(lang, codeText));
          // 「appendBlock(serializeCodeCard(lang, codeText));」: appendBlockを呼び出して必要な処理を実行する
        } else if (node.classList?.contains('formula-card')) {
        // 「else if (【条件】)」: 前条件が偽の場合に【条件】を追加判定する分岐
          const formulaText = node.dataset?.formula || '';
          // 「const formulaText = node.dataset?.formula || '';」: formulaTextを保持する変数
          appendBlock(serializeFormulaCard(formulaText));
          // 「appendBlock(serializeFormulaCard(formulaText));」: appendBlockを呼び出して必要な処理を実行する
        } else if (node.tagName === 'BR') {
        // 「else if (【条件】)」: 前条件が偽の場合に【条件】を追加判定する分岐
          text += '\n';
        }
      } else if (node.nodeType === 3) {
        // テキストノード（旧形式対応）
        const rawText = (node.nodeValue || '').replace(/\u200b/g, '');
        // 「const rawText = (node.nodeValue || '').replace(/\u200b/g, '');」: rawTextを保持する変数
        if (/^\s*$/.test(rawText) && (isCardNode(node.previousSibling) || isCardNode(node.nextSibling))) {
        // 「if (【条件】)」: 【条件】を判定する条件分岐
          return;
          // 「return 【値】;」: 呼び出し元へ【値】の値を返して処理を終了する
        }
        text += rawText;
      }
    });

    text = text
    // 「text = text;」: textの値を設定・更新する代入先
      .replace(/\n{2,}``formula/g, '\n``formula')
      .replace(/``\n{2,}/g, '``\n')
      .replace(/\n{3,}/g, '\n\n');

    if (bodyHidden) {
    // 「if (【条件】)」: 【条件】を判定する条件分岐
      bodyHidden.value = text;
      // 「bodyHidden.value = text;」: bodyHidden.valueの値を設定・更新する代入先
      bodyHidden.dispatchEvent(new Event('input'));
      // 「bodyHidden.dispatchEvent(new Event('input'));」: bodyHidden.dispatchEventを呼び出して必要な処理を実行する
    }

    if (bodySource && bodySource.value !== text) {
    // 「if (【条件】)」: 【条件】を判定する条件分岐
      bodySource.value = text;
      // 「bodySource.value = text;」: bodySource.valueの値を設定・更新する代入先
    }
  };

  const renderEditorFromSource = (sourceText) => {
  // 「const renderEditorFromSource = (sourceText) =>;」: renderEditorFromSourceを保持する変数
    bodyEditor.innerHTML = '';
    // 「bodyEditor.innerHTML = '';」: bodyEditor.innerHTMLの値を設定・更新する代入先
    bodyEditor.appendChild(document.createTextNode(sourceText || ''));
    // 「bodyEditor.appendChild(document.createTextNode(sourceText || ''));」: bodyEditor.appendChildを呼び出して必要な処理を実行する
    processEditorContent();
    // 「processEditorContent(【引数】);」: processEditorContentを呼び出して必要な処理を実行する
    bodyEditor.querySelectorAll(CARD_SELECTOR).forEach((card) => setCardMoveHandlers(card));
    // 「bodyEditor.querySelectorAll(CARD_SELECTOR).forEach((card) => setCardMoveHandlers(card));」: bodyEditor.querySelectorAllを呼び出して必要な処理を実行する
    syncHiddenField();
    // 「syncHiddenField(【引数】);」: syncHiddenFieldを呼び出して必要な処理を実行する
  };

  const insertTextAtSelection = (text) => {
  // 「const insertTextAtSelection = (text) =>;」: insertTextAtSelectionを保持する変数
    const sel = window.getSelection();
    // 「const sel = window.getSelection();」: selを保持する変数
    if (!sel || sel.rangeCount === 0) return;
    // 「if (【条件】)」: 【条件】を判定する条件分岐
    const range = sel.getRangeAt(0);
    // 「const range = sel.getRangeAt(0);」: rangeを保持する変数
    range.deleteContents();
    // 「range.deleteContents(【引数】);」: range.deleteContentsを呼び出して必要な処理を実行する
    const textNode = document.createTextNode(text);
    // 「const textNode = document.createTextNode(text);」: textNodeを保持する変数
    range.insertNode(textNode);
    // 「range.insertNode(textNode);」: range.insertNodeを呼び出して必要な処理を実行する
    range.setStartAfter(textNode);
    // 「range.setStartAfter(textNode);」: range.setStartAfterを呼び出して必要な処理を実行する
    range.collapse(true);
    // 「range.collapse(true);」: range.collapseを呼び出して必要な処理を実行する
    sel.removeAllRanges();
    // 「sel.removeAllRanges(【引数】);」: sel.removeAllRangesを呼び出して必要な処理を実行する
    sel.addRange(range);
    // 「sel.addRange(range);」: sel.addRangeを呼び出して必要な処理を実行する
  };

  const insertTextIntoSource = (text, cursorShift = 0) => {
  // 「const insertTextIntoSource = (text, cursorShift = 0) =>;」: insertTextIntoSourceを保持する変数
    if (!bodySource) return;
    // 「if (【条件】)」: 【条件】を判定する条件分岐

    const value = bodySource.value || '';
    // 「const value = bodySource.value || '';」: valueを保持する変数
    const hasSelection = typeof bodySource.selectionStart === 'number' && typeof bodySource.selectionEnd === 'number';
    // 「const hasSelection = typeof bodySource.selectionStart === 'number' && typeof bodySource.selectionEnd === 'number';」: hasSelectionを保持する変数
    const start = hasSelection ? bodySource.selectionStart : value.length;
    // 「const start = hasSelection ? bodySource.selectionStart : value.length;」: startを保持する変数
    const end = hasSelection ? bodySource.selectionEnd : value.length;
    // 「const end = hasSelection ? bodySource.selectionEnd : value.length;」: endを保持する変数
    const nextValue = `${value.slice(0, start)}${text}${value.slice(end)}`;
    // 「const nextValue = `${value.slice(0, start)}${text}${value.slice(end)}`;」: nextValueを保持する変数

    bodySource.value = nextValue;
    // 「bodySource.value = nextValue;」: bodySource.valueの値を設定・更新する代入先

    const caret = Math.max(start + text.length + cursorShift, 0);
    // 「const caret = Math.max(start + text.length + cursorShift, 0);」: caretを保持する変数
    if (typeof bodySource.setSelectionRange === 'function') {
    // 「if (【条件】)」: 【条件】を判定する条件分岐
      bodySource.focus();
      // 「bodySource.focus(【引数】);」: bodySource.focusを呼び出して必要な処理を実行する
      bodySource.setSelectionRange(caret, caret);
      // 「bodySource.setSelectionRange(caret, caret);」: bodySource.setSelectionRangeを呼び出して必要な処理を実行する
    }

    renderEditorFromSource(nextValue);
    // 「renderEditorFromSource(nextValue);」: renderEditorFromSourceを呼び出して必要な処理を実行する
  };

  // ========== ページ初期ロード時にカード化を実行 ==========
  const initialSourceText = bodySource
  // 「const initialSourceText = bodySource;」: initialSourceTextを保持する変数
    ? bodySource.value
    : ((bodyHidden && bodyHidden.value) || bodyEditor.textContent || '');
  renderEditorFromSource(initialSourceText);

  // ========== イベントリスナー登録 ==========
  // Enter キーで改行を挿入
  bodyEditor.addEventListener('keydown', (e) => {
    if (isPreviewOnly) {
    // 「if (【条件】)」: 【条件】を判定する条件分岐
      e.preventDefault();
      // 「e.preventDefault(【引数】);」: e.preventDefaultを呼び出して必要な処理を実行する
      return;
      // 「return 【値】;」: 呼び出し元へ【値】の値を返して処理を終了する
    }

    if (e.key === 'Enter') {
    // 「if (【条件】)」: 【条件】を判定する条件分岐
      e.preventDefault();
      // 「e.preventDefault(【引数】);」: e.preventDefaultを呼び出して必要な処理を実行する
      const sel = window.getSelection();
      // 「const sel = window.getSelection();」: selを保持する変数
      if (sel.rangeCount === 0) return;
      // 「if (【条件】)」: 【条件】を判定する条件分岐
      
      const range = sel.getRangeAt(0);
      
      // 新しい<div class="text-line">を作成
      const newLine = document.createElement('div');
      // 「const newLine = document.createElement('div');」: newLineを保持する変数
      newLine.className = 'text-line';
      // 「newLine.className = 'text-line';」: newLine.classNameの値を設定・更新する代入先
      newLine.contentEditable = 'true';
      
      // 現在のカーソル位置の後のコンテンツを新しい行に移動
      const tempContainer = document.createElement('div');
      // 「const tempContainer = document.createElement('div');」: tempContainerを保持する変数
      const endRange = range.cloneRange();
      // 「const endRange = range.cloneRange();」: endRangeを保持する変数
      endRange.collapse(false);
      // 「endRange.collapse(false);」: endRange.collapseを呼び出して必要な処理を実行する
      const fragment = endRange.extractContents();
      // 「const fragment = endRange.extractContents();」: fragmentを保持する変数
      if (fragment.childNodes.length > 0) {
      // 「if (【条件】)」: 【条件】を判定する条件分岐
        newLine.appendChild(fragment);
        // 「newLine.appendChild(fragment);」: newLine.appendChildを呼び出して必要な処理を実行する
      } else {
      // 「else」: 上記条件に当てはまらない場合の分岐
        const emptyMarker = document.createTextNode('\u200b');
        // 「const emptyMarker = document.createTextNode('\u200b');」: emptyMarkerを保持する変数
        newLine.appendChild(emptyMarker);
        // 「newLine.appendChild(emptyMarker);」: newLine.appendChildを呼び出して必要な処理を実行する
      }
      
      // 新しい行をカーソル位置の後に挿入
      const insertAfter = (element, referenceNode) => {
      // 「const insertAfter = (element, referenceNode) =>;」: insertAfterを保持する変数
        if (referenceNode.nextSibling) {
        // 「if (【条件】)」: 【条件】を判定する条件分岐
          referenceNode.parentNode.insertBefore(element, referenceNode.nextSibling);
          // 「referenceNode.parentNode.insertBefore(element, referenceNode.nextSibling);」: referenceNode.parentNode.insertBeforeを呼び出して必要な処理を実行する
        } else {
        // 「else」: 上記条件に当てはまらない場合の分岐
          referenceNode.parentNode.appendChild(element);
          // 「referenceNode.parentNode.appendChild(element);」: referenceNode.parentNode.appendChildを呼び出して必要な処理を実行する
        }
      };
      
      let currentNode = range.startContainer;
      // 「let currentNode = range.startContainer;」: currentNodeを保持する変数
      let parentLine = currentNode.nodeType === Node.TEXT_NODE ? currentNode.parentElement : currentNode;
      // 「let parentLine = currentNode.nodeType === Node.TEXT_NODE ? currentNode.parentElement : currentNode;」: parentLineを保持する変数
      if (!parentLine.classList?.contains('text-line')) {
      // 「if (【条件】)」: 【条件】を判定する条件分岐
        parentLine = parentLine.closest('.text-line') || bodyEditor;
        // 「parentLine = parentLine.closest('.text-line') || bodyEditor;」: parentLineの値を設定・更新する代入先
      }
      
      insertAfter(newLine, parentLine);
      
      // カーソルを新しい行の最初に設定
      const firstNodeInNew = newLine.firstChild || newLine;
      // 「const firstNodeInNew = newLine.firstChild || newLine;」: firstNodeInNewを保持する変数
      const newRange = document.createRange();
      // 「const newRange = document.createRange();」: newRangeを保持する変数
      if (firstNodeInNew.nodeType === Node.TEXT_NODE) {
      // 「if (【条件】)」: 【条件】を判定する条件分岐
        newRange.setStart(firstNodeInNew, 0);
        // 「newRange.setStart(firstNodeInNew, 0);」: newRange.setStartを呼び出して必要な処理を実行する
      } else {
      // 「else」: 上記条件に当てはまらない場合の分岐
        newRange.selectNodeContents(firstNodeInNew);
        // 「newRange.selectNodeContents(firstNodeInNew);」: newRange.selectNodeContentsを呼び出して必要な処理を実行する
        newRange.collapse(true);
        // 「newRange.collapse(true);」: newRange.collapseを呼び出して必要な処理を実行する
      }
      sel.removeAllRanges();
      // 「sel.removeAllRanges(【引数】);」: sel.removeAllRangesを呼び出して必要な処理を実行する
      sel.addRange(newRange);
      // 「sel.addRange(newRange);」: sel.addRangeを呼び出して必要な処理を実行する
      
      syncHiddenField();
      // 「syncHiddenField(【引数】);」: syncHiddenFieldを呼び出して必要な処理を実行する
    }
  });

  bodyEditor.addEventListener('input', () => {
    if (isPreviewOnly) return;
    // 「if (【条件】)」: 【条件】を判定する条件分岐
    processEditorContent();
    // 「processEditorContent(【引数】);」: processEditorContentを呼び出して必要な処理を実行する
    bodyEditor.querySelectorAll(CARD_SELECTOR).forEach((card) => setCardMoveHandlers(card));
    // 「bodyEditor.querySelectorAll(CARD_SELECTOR).forEach((card) => setCardMoveHandlers(card));」: bodyEditor.querySelectorAllを呼び出して必要な処理を実行する
    syncHiddenField();
    // 「syncHiddenField(【引数】);」: syncHiddenFieldを呼び出して必要な処理を実行する
  });

  if (bodySource) {
  // 「if (【条件】)」: 【条件】を判定する条件分岐
    bodySource.addEventListener('input', () => {
      renderEditorFromSource(bodySource.value || '');
      // 「renderEditorFromSource(bodySource.value || '');」: renderEditorFromSourceを呼び出して必要な処理を実行する
    });
  }

  bodyEditor.addEventListener('paste', (e) => {
    if (isPreviewOnly) {
    // 「if (【条件】)」: 【条件】を判定する条件分岐
      e.preventDefault();
      // 「e.preventDefault(【引数】);」: e.preventDefaultを呼び出して必要な処理を実行する
      return;
      // 「return 【値】;」: 呼び出し元へ【値】の値を返して処理を終了する
    }

    // クリップボードから画像データを取得
    const items = e.clipboardData?.items;
    // 「const items = e.clipboardData?.items;」: itemsを保持する変数
    if (items) {
    // 「if (【条件】)」: 【条件】を判定する条件分岐
      let hasImage = false;
      // 「let hasImage = false;」: hasImageを保持する変数
      const imagesToInsert = [];
      // 「const imagesToInsert = [];」: imagesToInsertを保持する変数
      
      for (let i = 0; i < items.length; i++) {
      // 「for (let i = 0; i < items.length; i++)」: 繰り返し処理を行うループ
        const item = items[i];
        // 画像データの場合
        if (item.type.indexOf('image') !== -1) {
        // 「if (【条件】)」: 【条件】を判定する条件分岐
          hasImage = true;
          // 「hasImage = true;」: hasImageの値を設定・更新する代入先
          e.preventDefault(); // デフォルトの貼り付けを防止
          
          const blob = item.getAsFile();
          // 「const blob = item.getAsFile();」: blobを保持する変数
          if (blob) {
            // ファイル名を生成（タイムスタンプ付き）
            const timestamp = Date.now();
            // 「const timestamp = Date.now();」: timestampを保持する変数
            const extension = blob.type.split('/')[1] || 'png';
            // 「const extension = blob.type.split('/')[1] || 'png';」: extensionを保持する変数
            const filename = `pasted-image-${timestamp}.${extension}`;
            
            // Fileオブジェクトを作成
            const file = new File([blob], filename, { type: blob.type });
            
            // ローカルURLマップに追加
            localImageUrlMap.set(filename, URL.createObjectURL(file));
            
            // allFilesに追加（重複チェック）
            if (!allFiles.find((f) => f.name === filename)) {
            // 「if (【条件】)」: 【条件】を判定する条件分岐
              allFiles.push(file);
              // 「allFiles.push(file);」: allFiles.pushを呼び出して必要な処理を実行する
            }
            
            imagesToInsert.push(filename);
            // 「imagesToInsert.push(filename);」: imagesToInsert.pushを呼び出して必要な処理を実行する
          }
        }
      }
      
      if (hasImage && imagesToInsert.length > 0) {
        // DataTransferを使ってimageInputのfilesを更新
        if (imageInput) {
        // 「if (【条件】)」: 【条件】を判定する条件分岐
          isUpdatingInputFiles = true; // フラグを立てる
          const dt = new DataTransfer();
          // 「const dt = new DataTransfer();」: dtを保持する変数
          allFiles.forEach((file) => dt.items.add(file));
          // 「allFiles.forEach((file) => dt.items.add(file));」: allFiles.forEachを呼び出して必要な処理を実行する
          imageInput.files = dt.files;
          // 「imageInput.files = dt.files;」: imageInput.filesの値を設定・更新する代入先
          setTimeout(() => { isUpdatingInputFiles = false; }, 0); // フラグを下ろす
        }
        
        // カーソル位置に画像記法を挿入
        const sel = window.getSelection();
        // 「const sel = window.getSelection();」: selを保持する変数
        if (sel.rangeCount === 0) {
        // 「if (【条件】)」: 【条件】を判定する条件分岐
          const range = document.createRange();
          // 「const range = document.createRange();」: rangeを保持する変数
          range.selectNodeContents(bodyEditor);
          // 「range.selectNodeContents(bodyEditor);」: range.selectNodeContentsを呼び出して必要な処理を実行する
          range.collapse(false);
          // 「range.collapse(false);」: range.collapseを呼び出して必要な処理を実行する
          sel.addRange(range);
          // 「sel.addRange(range);」: sel.addRangeを呼び出して必要な処理を実行する
        }
        
        const lines = imagesToInsert.map((filename) => `![説明](image:${filename})`);
        // 「const lines = imagesToInsert.map((filename) => `![説明](image:${filename})`);」: linesを保持する変数
        const text = lines.join('\n');
        // 「const text = lines.join('\n');」: textを保持する変数
        
        const range = sel.getRangeAt(0);
        // 「const range = sel.getRangeAt(0);」: rangeを保持する変数
        const textNode = document.createTextNode(text);
        // 「const textNode = document.createTextNode(text);」: textNodeを保持する変数
        range.insertNode(textNode);
        // 「range.insertNode(textNode);」: range.insertNodeを呼び出して必要な処理を実行する
        range.setStartAfter(textNode);
        // 「range.setStartAfter(textNode);」: range.setStartAfterを呼び出して必要な処理を実行する
        range.collapse(true);
        // 「range.collapse(true);」: range.collapseを呼び出して必要な処理を実行する
        sel.removeAllRanges();
        // 「sel.removeAllRanges(【引数】);」: sel.removeAllRangesを呼び出して必要な処理を実行する
        sel.addRange(range);
        // 「sel.addRange(range);」: sel.addRangeを呼び出して必要な処理を実行する
        
        bodyEditor.focus();
        // 「bodyEditor.focus(【引数】);」: bodyEditor.focusを呼び出して必要な処理を実行する
        processEditorContent();
        // 「processEditorContent(【引数】);」: processEditorContentを呼び出して必要な処理を実行する
        syncHiddenField();
        // 「syncHiddenField(【引数】);」: syncHiddenFieldを呼び出して必要な処理を実行する
        return;
        // 「return 【値】;」: 呼び出し元へ【値】の値を返して処理を終了する
      }
    }
    
    // 画像以外の貼り付け（テキストなど）の場合
    setTimeout(() => {
      processEditorContent();
      // 「processEditorContent(【引数】);」: processEditorContentを呼び出して必要な処理を実行する
      syncHiddenField();
      // 「syncHiddenField(【引数】);」: syncHiddenFieldを呼び出して必要な処理を実行する
    }, 0);
  });

  bodyEditor.addEventListener('blur', () => {
    syncHiddenField();
    // 「syncHiddenField(【引数】);」: syncHiddenFieldを呼び出して必要な処理を実行する
  });

  // 画像挿入
  if (insertImageButton) {
  // 「if (【条件】)」: 【条件】を判定する条件分岐
    insertImageButton.addEventListener('click', () => {
      const selection = window.getSelection();
      // 「const selection = window.getSelection();」: selectionを保持する変数
      if (!isPreviewOnly && selection && selection.rangeCount > 0 && isLockedCardNode(selection.anchorNode)) {
      // 「if (【条件】)」: 【条件】を判定する条件分岐
        alert('コードカードや数式カード内に画像を挿入することはできません。');
        // 「alert('コードカードや数式カード内に画像を挿入することはできません。');」: alertを呼び出して必要な処理を実行する
        return;
        // 「return 【値】;」: 呼び出し元へ【値】の値を返して処理を終了する
      }
      imageInput?.click();
    });
  }

  if (insertTextButton) {
  // 「if (【条件】)」: 【条件】を判定する条件分岐
    insertTextButton.addEventListener('click', (e) => {
      e.preventDefault();
      // 「e.preventDefault(【引数】);」: e.preventDefaultを呼び出して必要な処理を実行する
      const modal = ensureTextModal();
      // 「const modal = ensureTextModal();」: modalを保持する変数
      modal.textarea.value = '';
      // 「modal.textarea.value = '';」: modal.textarea.valueの値を設定・更新する代入先
      modal.overlay.style.display = 'flex';
      // 「modal.overlay.style.display = 'flex';」: modal.overlay.style.displayの値を設定・更新する代入先
      modal.overlay.classList.add('is-open');
      // 「modal.overlay.classList.add('is-open');」: modal.overlay.classList.addを呼び出して必要な処理を実行する
      modal.textarea.focus();
      // 「modal.textarea.focus(【引数】);」: modal.textarea.focusを呼び出して必要な処理を実行する

      const onSave = () => {
      // 「const onSave = () =>;」: onSaveを保持する変数
        const value = modal.textarea.value || '';
        // 「const value = modal.textarea.value || '';」: valueを保持する変数
        const token = serializeTextCard(value);
        // 「const token = serializeTextCard(value);」: tokenを保持する変数
        if (bodySource) {
        // 「if (【条件】)」: 【条件】を判定する条件分岐
          insertTextIntoSource(`\n${token}\n`);
          // 「insertTextIntoSource(`\n${token}\n`);」: insertTextIntoSourceを呼び出して必要な処理を実行する
        }
        modal.overlay.classList.remove('is-open');
        // 「modal.overlay.classList.remove('is-open');」: modal.overlay.classList.removeを呼び出して必要な処理を実行する
        modal.overlay.style.display = 'none';
        // 「modal.overlay.style.display = 'none';」: modal.overlay.style.displayの値を設定・更新する代入先
        modal.saveBtn.removeEventListener('click', onSave);
        // 「modal.saveBtn.removeEventListener('click', onSave);」: modal.saveBtn.removeEventListenerを呼び出して必要な処理を実行する
        modal.cancelBtn.removeEventListener('click', onCancel);
        // 「modal.cancelBtn.removeEventListener('click', onCancel);」: modal.cancelBtn.removeEventListenerを呼び出して必要な処理を実行する
      };
      const onCancel = () => {
      // 「const onCancel = () =>;」: onCancelを保持する変数
        modal.overlay.classList.remove('is-open');
        // 「modal.overlay.classList.remove('is-open');」: modal.overlay.classList.removeを呼び出して必要な処理を実行する
        modal.overlay.style.display = 'none';
        // 「modal.overlay.style.display = 'none';」: modal.overlay.style.displayの値を設定・更新する代入先
        modal.saveBtn.removeEventListener('click', onSave);
        // 「modal.saveBtn.removeEventListener('click', onSave);」: modal.saveBtn.removeEventListenerを呼び出して必要な処理を実行する
        modal.cancelBtn.removeEventListener('click', onCancel);
        // 「modal.cancelBtn.removeEventListener('click', onCancel);」: modal.cancelBtn.removeEventListenerを呼び出して必要な処理を実行する
      };

      modal.saveBtn.addEventListener('click', onSave);
      // 「modal.saveBtn.addEventListener('click', onSave);」: modal.saveBtn.addEventListenerを呼び出して必要な処理を実行する
      modal.cancelBtn.addEventListener('click', onCancel);
      // 「modal.cancelBtn.addEventListener('click', onCancel);」: modal.cancelBtn.addEventListenerを呼び出して必要な処理を実行する
    });
  }

  if (insertUrlButton) {
  // 「if (【条件】)」: 【条件】を判定する条件分岐
    insertUrlButton.addEventListener('click', (e) => {
      e.preventDefault();
      // 「e.preventDefault(【引数】);」: e.preventDefaultを呼び出して必要な処理を実行する
      const modal = ensureTextModal();
      // 「const modal = ensureTextModal();」: modalを保持する変数
      modal.textarea.value = 'https://';
      // 「modal.textarea.value = 'https://';」: modal.textarea.valueの値を設定・更新する代入先
      modal.overlay.style.display = 'flex';
      // 「modal.overlay.style.display = 'flex';」: modal.overlay.style.displayの値を設定・更新する代入先
      modal.overlay.classList.add('is-open');
      // 「modal.overlay.classList.add('is-open');」: modal.overlay.classList.addを呼び出して必要な処理を実行する
      modal.textarea.focus();
      // 「modal.textarea.focus(【引数】);」: modal.textarea.focusを呼び出して必要な処理を実行する

      const onSave = () => {
      // 「const onSave = () =>;」: onSaveを保持する変数
        const value = (modal.textarea.value || '').trim();
        // 「const value = (modal.textarea.value || '').trim();」: valueを保持する変数
        if (value) {
        // 「if (【条件】)」: 【条件】を判定する条件分岐
          const token = serializeUrlCard(value);
          // 「const token = serializeUrlCard(value);」: tokenを保持する変数
          if (bodySource) {
          // 「if (【条件】)」: 【条件】を判定する条件分岐
            insertTextIntoSource(`\n${token}\n`);
            // 「insertTextIntoSource(`\n${token}\n`);」: insertTextIntoSourceを呼び出して必要な処理を実行する
          }
        }
        modal.overlay.classList.remove('is-open');
        // 「modal.overlay.classList.remove('is-open');」: modal.overlay.classList.removeを呼び出して必要な処理を実行する
        modal.overlay.style.display = 'none';
        // 「modal.overlay.style.display = 'none';」: modal.overlay.style.displayの値を設定・更新する代入先
        modal.saveBtn.removeEventListener('click', onSave);
        // 「modal.saveBtn.removeEventListener('click', onSave);」: modal.saveBtn.removeEventListenerを呼び出して必要な処理を実行する
        modal.cancelBtn.removeEventListener('click', onCancel);
        // 「modal.cancelBtn.removeEventListener('click', onCancel);」: modal.cancelBtn.removeEventListenerを呼び出して必要な処理を実行する
      };
      const onCancel = () => {
      // 「const onCancel = () =>;」: onCancelを保持する変数
        modal.overlay.classList.remove('is-open');
        // 「modal.overlay.classList.remove('is-open');」: modal.overlay.classList.removeを呼び出して必要な処理を実行する
        modal.overlay.style.display = 'none';
        // 「modal.overlay.style.display = 'none';」: modal.overlay.style.displayの値を設定・更新する代入先
        modal.saveBtn.removeEventListener('click', onSave);
        // 「modal.saveBtn.removeEventListener('click', onSave);」: modal.saveBtn.removeEventListenerを呼び出して必要な処理を実行する
        modal.cancelBtn.removeEventListener('click', onCancel);
        // 「modal.cancelBtn.removeEventListener('click', onCancel);」: modal.cancelBtn.removeEventListenerを呼び出して必要な処理を実行する
      };

      modal.saveBtn.addEventListener('click', onSave);
      // 「modal.saveBtn.addEventListener('click', onSave);」: modal.saveBtn.addEventListenerを呼び出して必要な処理を実行する
      modal.cancelBtn.addEventListener('click', onCancel);
      // 「modal.cancelBtn.addEventListener('click', onCancel);」: modal.cancelBtn.addEventListenerを呼び出して必要な処理を実行する
    });
  }

  if (openPreviewButton) {
  // 「if (【条件】)」: 【条件】を判定する条件分岐
    openPreviewButton.addEventListener('click', (e) => {
      e.preventDefault();
      // 「e.preventDefault(【引数】);」: e.preventDefaultを呼び出して必要な処理を実行する
      const modal = ensurePreviewModal();
      // 「const modal = ensurePreviewModal();」: modalを保持する変数
      const clone = bodyEditor.cloneNode(true);
      // 「const clone = bodyEditor.cloneNode(true);」: cloneを保持する変数
      clone.removeAttribute('id');
      // 「clone.removeAttribute('id');」: clone.removeAttributeを呼び出して必要な処理を実行する
      clone.querySelectorAll('button').forEach((btn) => btn.remove());
      // 「clone.querySelectorAll('button').forEach((btn) => btn.remove());」: clone.querySelectorAllを呼び出して必要な処理を実行する
      modal.body.innerHTML = '';
      // 「modal.body.innerHTML = '';」: modal.body.innerHTMLの値を設定・更新する代入先
      modal.body.appendChild(clone);
      // 「modal.body.appendChild(clone);」: modal.body.appendChildを呼び出して必要な処理を実行する
      modal.overlay.style.display = 'flex';
      // 「modal.overlay.style.display = 'flex';」: modal.overlay.style.displayの値を設定・更新する代入先
      modal.overlay.classList.add('is-open');
      // 「modal.overlay.classList.add('is-open');」: modal.overlay.classList.addを呼び出して必要な処理を実行する

      const onClose = () => {
      // 「const onClose = () =>;」: onCloseを保持する変数
        modal.overlay.classList.remove('is-open');
        // 「modal.overlay.classList.remove('is-open');」: modal.overlay.classList.removeを呼び出して必要な処理を実行する
        modal.overlay.style.display = 'none';
        // 「modal.overlay.style.display = 'none';」: modal.overlay.style.displayの値を設定・更新する代入先
        modal.closeBtn.removeEventListener('click', onClose);
        // 「modal.closeBtn.removeEventListener('click', onClose);」: modal.closeBtn.removeEventListenerを呼び出して必要な処理を実行する
      };
      modal.closeBtn.addEventListener('click', onClose);
      // 「modal.closeBtn.addEventListener('click', onClose);」: modal.closeBtn.addEventListenerを呼び出して必要な処理を実行する
    });
  }

  if (imageInput) {
  // 「if (【条件】)」: 【条件】を判定する条件分岐
    imageInput.addEventListener('change', () => {
      // 再帰的なchangeイベントをスキップ
      if (isUpdatingInputFiles) return;
      // 「if (【条件】)」: 【条件】を判定する条件分岐
      
      if (!imageInput.files || imageInput.files.length === 0) return;
      // 「if (【条件】)」: 【条件】を判定する条件分岐

      const newFiles = Array.from(imageInput.files);
      // 「const newFiles = Array.from(imageInput.files);」: newFilesを保持する変数
      newFiles.forEach((file) => {
        if (!localImageUrlMap.has(file.name)) {
        // 「if (【条件】)」: 【条件】を判定する条件分岐
          localImageUrlMap.set(file.name, URL.createObjectURL(file));
          // 「localImageUrlMap.set(file.name, URL.createObjectURL(file));」: localImageUrlMap.setを呼び出して必要な処理を実行する
        }
        if (!allFiles.find((f) => f.name === file.name && f.size === file.size)) {
        // 「if (【条件】)」: 【条件】を判定する条件分岐
          allFiles.push(file);
          // 「allFiles.push(file);」: allFiles.pushを呼び出して必要な処理を実行する
        }
      });

      isUpdatingInputFiles = true; // フラグを立てる
      const dt = new DataTransfer();
      // 「const dt = new DataTransfer();」: dtを保持する変数
      allFiles.forEach((file) => dt.items.add(file));
      // 「allFiles.forEach((file) => dt.items.add(file));」: allFiles.forEachを呼び出して必要な処理を実行する
      imageInput.files = dt.files;
      // 「imageInput.files = dt.files;」: imageInput.filesの値を設定・更新する代入先
      setTimeout(() => { isUpdatingInputFiles = false; }, 0); // フラグを下ろす

      if (isPreviewOnly && bodySource) {
      // 「if (【条件】)」: 【条件】を判定する条件分岐
        const lines = newFiles.map((file) => `![説明](image:${file.name})`);
        // 「const lines = newFiles.map((file) => `![説明](image:${file.name})`);」: linesを保持する変数
        const text = lines.join('\n');
        // 「const text = lines.join('\n');」: textを保持する変数
        insertTextIntoSource(text);
        // 「insertTextIntoSource(text);」: insertTextIntoSourceを呼び出して必要な処理を実行する
        return;
        // 「return 【値】;」: 呼び出し元へ【値】の値を返して処理を終了する
      }

      // contenteditable divに挿入
      const sel = window.getSelection();
      // 「const sel = window.getSelection();」: selを保持する変数
      if (sel.rangeCount === 0) {
      // 「if (【条件】)」: 【条件】を判定する条件分岐
        const range = document.createRange();
        // 「const range = document.createRange();」: rangeを保持する変数
        range.selectNodeContents(bodyEditor);
        // 「range.selectNodeContents(bodyEditor);」: range.selectNodeContentsを呼び出して必要な処理を実行する
        range.collapse(false);
        // 「range.collapse(false);」: range.collapseを呼び出して必要な処理を実行する
        sel.addRange(range);
        // 「sel.addRange(range);」: sel.addRangeを呼び出して必要な処理を実行する
      }

      const lines = newFiles.map((file) => `![説明](image:${file.name})`);
      // 「const lines = newFiles.map((file) => `![説明](image:${file.name})`);」: linesを保持する変数
      const text = lines.join('\n');
      // 「const text = lines.join('\n');」: textを保持する変数
      
      const range = sel.getRangeAt(0);
      // 「const range = sel.getRangeAt(0);」: rangeを保持する変数
      const textNode = document.createTextNode(text);
      // 「const textNode = document.createTextNode(text);」: textNodeを保持する変数
      range.insertNode(textNode);
      // 「range.insertNode(textNode);」: range.insertNodeを呼び出して必要な処理を実行する
      range.setStartAfter(textNode);
      // 「range.setStartAfter(textNode);」: range.setStartAfterを呼び出して必要な処理を実行する
      range.collapse(true);
      // 「range.collapse(true);」: range.collapseを呼び出して必要な処理を実行する
      sel.removeAllRanges();
      // 「sel.removeAllRanges(【引数】);」: sel.removeAllRangesを呼び出して必要な処理を実行する
      sel.addRange(range);
      // 「sel.addRange(range);」: sel.addRangeを呼び出して必要な処理を実行する

      bodyEditor.focus();
      // 「bodyEditor.focus(【引数】);」: bodyEditor.focusを呼び出して必要な処理を実行する
      processEditorContent();
      // 「processEditorContent(【引数】);」: processEditorContentを呼び出して必要な処理を実行する
      syncHiddenField();
      // 「syncHiddenField(【引数】);」: syncHiddenFieldを呼び出して必要な処理を実行する
    });
  }

  // コード挿入
  if (insertCodeButton) {
  // 「if (【条件】)」: 【条件】を判定する条件分岐
    insertCodeButton.addEventListener('click', (e) => {
      e.preventDefault();
      // 「e.preventDefault(【引数】);」: e.preventDefaultを呼び出して必要な処理を実行する

      if (isPreviewOnly && bodySource) {
      // 「if (【条件】)」: 【条件】を判定する条件分岐
        const template = '\n```ruby\n\n```\n';
        // 「const template = '\n```ruby\n\n```\n';」: templateを保持する変数
        insertTextIntoSource(template, -5);
        // 「insertTextIntoSource(template, -5);」: insertTextIntoSourceを呼び出して必要な処理を実行する
        return;
        // 「return 【値】;」: 呼び出し元へ【値】の値を返して処理を終了する
      }

      const range = resolveEditorRange();
      // 「const range = resolveEditorRange();」: rangeを保持する変数
      if (!range) {
      // 「if (【条件】)」: 【条件】を判定する条件分岐
        alert('コードカードや数式カード内にコードを挿入することはできません。');
        // 「alert('コードカードや数式カード内にコードを挿入することはできません。');」: alertを呼び出して必要な処理を実行する
        return;
        // 「return 【値】;」: 呼び出し元へ【値】の値を返して処理を終了する
      }

      const existingCodeCards = new Set(Array.from(bodyEditor.querySelectorAll('.code-card')));
      // 「const existingCodeCards = new Set(Array.from(bodyEditor.querySelectorAll('.code-card')));」: existingCodeCardsを保持する変数
      const template = '\n```ruby\n\n```\n';
      // 「const template = '\n```ruby\n\n```\n';」: templateを保持する変数
      const textNode = document.createTextNode(template);
      // 「const textNode = document.createTextNode(template);」: textNodeを保持する変数
      range.insertNode(textNode);
      
      // カーソルをコードブロック内に移動
      const sel = window.getSelection();
      // 「const sel = window.getSelection();」: selを保持する変数
      const newRange = document.createRange();
      // 「const newRange = document.createRange();」: newRangeを保持する変数
      newRange.setStart(textNode, 10); // ```ruby\n の次
      newRange.collapse(true);
      // 「newRange.collapse(true);」: newRange.collapseを呼び出して必要な処理を実行する
      sel.removeAllRanges();
      // 「sel.removeAllRanges(【引数】);」: sel.removeAllRangesを呼び出して必要な処理を実行する
      sel.addRange(newRange);
      // 「sel.addRange(newRange);」: sel.addRangeを呼び出して必要な処理を実行する

      bodyEditor.focus();
      // 「bodyEditor.focus(【引数】);」: bodyEditor.focusを呼び出して必要な処理を実行する
      
      setTimeout(() => {
        processEditorContent();
        // 「processEditorContent(【引数】);」: processEditorContentを呼び出して必要な処理を実行する
        syncHiddenField();
        // 「syncHiddenField(【引数】);」: syncHiddenFieldを呼び出して必要な処理を実行する
        
        const allCodeCards = bodyEditor.querySelectorAll('.code-card');
        // 「const allCodeCards = bodyEditor.querySelectorAll('.code-card');」: allCodeCardsを保持する変数
        const newCodeCards = Array.from(allCodeCards).filter((card) => !existingCodeCards.has(card));
        // 「const newCodeCards = Array.from(allCodeCards).filter((card) => !existingCodeCards.has(card));」: newCodeCardsを保持する変数
        const newCodeCard = newCodeCards.length > 0 ? newCodeCards[newCodeCards.length - 1] : null;
        // 「const newCodeCard = newCodeCards.length > 0 ? newCodeCards[newCodeCards.length - 1] : null;」: newCodeCardを保持する変数
        
        if (newCodeCard) {
        // 「if (【条件】)」: 【条件】を判定する条件分岐
          const modal = ensureCodeModal();
          // 「const modal = ensureCodeModal();」: modalを保持する変数
          modal.textarea.value = '';
          // 「modal.textarea.value = '';」: modal.textarea.valueの値を設定・更新する代入先
          modal.overlay.classList.add('is-open');
          // 「modal.overlay.classList.add('is-open');」: modal.overlay.classList.addを呼び出して必要な処理を実行する
          modal.textarea.focus();
          // 「modal.textarea.focus(【引数】);」: modal.textarea.focusを呼び出して必要な処理を実行する

          const onSave = () => {
          // 「const onSave = () =>;」: onSaveを保持する変数
            newCodeCard.dataset.code = modal.textarea.value;
            // 「newCodeCard.dataset.code = modal.textarea.value;」: newCodeCard.dataset.codeの値を設定・更新する代入先
            const pre = newCodeCard.querySelector('pre');
            // 「const pre = newCodeCard.querySelector('pre');」: preを保持する変数
            if (pre) pre.textContent = modal.textarea.value;
            // 「if (【条件】)」: 【条件】を判定する条件分岐
            modal.overlay.classList.remove('is-open');
            // 「modal.overlay.classList.remove('is-open');」: modal.overlay.classList.removeを呼び出して必要な処理を実行する
            syncHiddenField();
            // 「syncHiddenField(【引数】);」: syncHiddenFieldを呼び出して必要な処理を実行する
            modal.saveBtn.removeEventListener('click', onSave);
            // 「modal.saveBtn.removeEventListener('click', onSave);」: modal.saveBtn.removeEventListenerを呼び出して必要な処理を実行する
            modal.cancelBtn.removeEventListener('click', onCancel);
            // 「modal.cancelBtn.removeEventListener('click', onCancel);」: modal.cancelBtn.removeEventListenerを呼び出して必要な処理を実行する
          };
          const onCancel = () => {
          // 「const onCancel = () =>;」: onCancelを保持する変数
            modal.overlay.classList.remove('is-open');
            // 「modal.overlay.classList.remove('is-open');」: modal.overlay.classList.removeを呼び出して必要な処理を実行する
            const prevNode = newCodeCard.previousSibling;
            // 「const prevNode = newCodeCard.previousSibling;」: prevNodeを保持する変数
            const nextNode = newCodeCard.nextSibling;
            // 「const nextNode = newCodeCard.nextSibling;」: nextNodeを保持する変数
            newCodeCard.remove();
            // 「newCodeCard.remove(【引数】);」: newCodeCard.removeを呼び出して必要な処理を実行する
            [prevNode, nextNode].forEach((node) => {
              if (node && node.nodeType === Node.TEXT_NODE) {
              // 「if (【条件】)」: 【条件】を判定する条件分岐
                const text = (node.nodeValue || '').replace(/\u200b/g, '').trim();
                // 「const text = (node.nodeValue || '').replace(/\u200b/g, '').trim();」: textを保持する変数
                if (!text) node.remove();
                // 「if (【条件】)」: 【条件】を判定する条件分岐
              }
            });
            syncHiddenField();
            // 「syncHiddenField(【引数】);」: syncHiddenFieldを呼び出して必要な処理を実行する
            modal.saveBtn.removeEventListener('click', onSave);
            // 「modal.saveBtn.removeEventListener('click', onSave);」: modal.saveBtn.removeEventListenerを呼び出して必要な処理を実行する
            modal.cancelBtn.removeEventListener('click', onCancel);
            // 「modal.cancelBtn.removeEventListener('click', onCancel);」: modal.cancelBtn.removeEventListenerを呼び出して必要な処理を実行する
          };

          modal.saveBtn.addEventListener('click', onSave);
          // 「modal.saveBtn.addEventListener('click', onSave);」: modal.saveBtn.addEventListenerを呼び出して必要な処理を実行する
          modal.cancelBtn.addEventListener('click', onCancel);
          // 「modal.cancelBtn.addEventListener('click', onCancel);」: modal.cancelBtn.addEventListenerを呼び出して必要な処理を実行する
        }
      }, 50);
    });
  }

  // 数式挿入
  if (insertFormulaButton) {
  // 「if (【条件】)」: 【条件】を判定する条件分岐
    insertFormulaButton.addEventListener('click', (e) => {
      e.preventDefault();
      // 「e.preventDefault(【引数】);」: e.preventDefaultを呼び出して必要な処理を実行する

      const currentSelection = window.getSelection();
      // 「const currentSelection = window.getSelection();」: currentSelectionを保持する変数
      if (currentSelection && currentSelection.rangeCount > 0 && isLockedCardNode(currentSelection.anchorNode)) {
      // 「if (【条件】)」: 【条件】を判定する条件分岐
        alert('コードカードや数式カード内に数式を挿入することはできません。');
        // 「alert('コードカードや数式カード内に数式を挿入することはできません。');」: alertを呼び出して必要な処理を実行する
        return;
        // 「return 【値】;」: 呼び出し元へ【値】の値を返して処理を終了する
      }
      
      const selection = window.getSelection();
      // 「const selection = window.getSelection();」: selectionを保持する変数
      let savedRange = null;
      // 「let savedRange = null;」: savedRangeを保持する変数
      if (selection && selection.rangeCount > 0 && bodyEditor.contains(selection.anchorNode) && !isLockedCardNode(selection.anchorNode)) {
      // 「if (【条件】)」: 【条件】を判定する条件分岐
        savedRange = selection.getRangeAt(0).cloneRange();
        // 「savedRange = selection.getRangeAt(0).cloneRange();」: savedRangeの値を設定・更新する代入先
      }
      
      // モーダルを表示
      const modal = ensureFormulaModal();
      // 「const modal = ensureFormulaModal();」: modalを保持する変数
      modal.textarea.value = '';
      // 「modal.textarea.value = '';」: modal.textarea.valueの値を設定・更新する代入先
      if (modal.overlay) {
      // 「if (【条件】)」: 【条件】を判定する条件分岐
        modal.overlay.style.display = 'flex';
        // 「modal.overlay.style.display = 'flex';」: modal.overlay.style.displayの値を設定・更新する代入先
        modal.overlay.classList.add('is-open');
        // 「modal.overlay.classList.add('is-open');」: modal.overlay.classList.addを呼び出して必要な処理を実行する
      }
      modal.textarea.focus();

      // イベントハンドラを一度実行して古いハンドラを削除
      const oldSaveBtn = modal.saveBtn.cloneNode(true);
      // 「const oldSaveBtn = modal.saveBtn.cloneNode(true);」: oldSaveBtnを保持する変数
      const oldCancelBtn = modal.cancelBtn.cloneNode(true);
      // 「const oldCancelBtn = modal.cancelBtn.cloneNode(true);」: oldCancelBtnを保持する変数
      modal.saveBtn.parentNode.replaceChild(oldSaveBtn, modal.saveBtn);
      // 「modal.saveBtn.parentNode.replaceChild(oldSaveBtn, modal.saveBtn);」: modal.saveBtn.parentNode.replaceChildを呼び出して必要な処理を実行する
      modal.cancelBtn.parentNode.replaceChild(oldCancelBtn, modal.cancelBtn);
      // 「modal.cancelBtn.parentNode.replaceChild(oldCancelBtn, modal.cancelBtn);」: modal.cancelBtn.parentNode.replaceChildを呼び出して必要な処理を実行する
      const newModal = {
      // 「const newModal = 【値】;」: newModalを保持する変数
        ...modal,
        saveBtn: oldSaveBtn,
        cancelBtn: oldCancelBtn
      };

      const onSave = () => {
      // 「const onSave = () =>;」: onSaveを保持する変数
        const formulaText = newModal.textarea.value || '';
        // 「const formulaText = newModal.textarea.value || '';」: formulaTextを保持する変数
        const formulaMarkdown = `\n\`\`formula\ntext:${formulaText}\n\`\`\n`;
        // 「const formulaMarkdown = `\n\`\`formula\ntext:${formulaText}\n\`\`\n`;」: formulaMarkdownを保持する変数

        if (isPreviewOnly && bodySource) {
        // 「if (【条件】)」: 【条件】を判定する条件分岐
          insertTextIntoSource(formulaMarkdown);
          // 「insertTextIntoSource(formulaMarkdown);」: insertTextIntoSourceを呼び出して必要な処理を実行する
          if (newModal.overlay) {
          // 「if (【条件】)」: 【条件】を判定する条件分岐
            newModal.overlay.classList.remove('is-open');
            // 「newModal.overlay.classList.remove('is-open');」: newModal.overlay.classList.removeを呼び出して必要な処理を実行する
            newModal.overlay.style.display = 'none';
            // 「newModal.overlay.style.display = 'none';」: newModal.overlay.style.displayの値を設定・更新する代入先
          }
          return;
          // 「return 【値】;」: 呼び出し元へ【値】の値を返して処理を終了する
        }
        
        // カーソル位置に挿入
        bodyEditor.focus();
        // 「bodyEditor.focus(【引数】);」: bodyEditor.focusを呼び出して必要な処理を実行する
        const sel = window.getSelection();
        // 「const sel = window.getSelection();」: selを保持する変数
        if (!sel) return;
        // 「if (【条件】)」: 【条件】を判定する条件分岐

        if (savedRange && !isLockedCardNode(savedRange.startContainer)) {
        // 「if (【条件】)」: 【条件】を判定する条件分岐
          sel.removeAllRanges();
          // 「sel.removeAllRanges(【引数】);」: sel.removeAllRangesを呼び出して必要な処理を実行する
          sel.addRange(savedRange);
          // 「sel.addRange(savedRange);」: sel.addRangeを呼び出して必要な処理を実行する
        } else {
        // 「else」: 上記条件に当てはまらない場合の分岐
          const fallbackRange = document.createRange();
          // 「const fallbackRange = document.createRange();」: fallbackRangeを保持する変数
          fallbackRange.selectNodeContents(bodyEditor);
          // 「fallbackRange.selectNodeContents(bodyEditor);」: fallbackRange.selectNodeContentsを呼び出して必要な処理を実行する
          fallbackRange.collapse(false);
          // 「fallbackRange.collapse(false);」: fallbackRange.collapseを呼び出して必要な処理を実行する
          sel.removeAllRanges();
          // 「sel.removeAllRanges(【引数】);」: sel.removeAllRangesを呼び出して必要な処理を実行する
          sel.addRange(fallbackRange);
          // 「sel.addRange(fallbackRange);」: sel.addRangeを呼び出して必要な処理を実行する
        }

        const range = sel.getRangeAt(0);
        // 「const range = sel.getRangeAt(0);」: rangeを保持する変数
        const textNode = document.createTextNode(formulaMarkdown);
        // 「const textNode = document.createTextNode(formulaMarkdown);」: textNodeを保持する変数
        range.insertNode(textNode);
        // 「range.insertNode(textNode);」: range.insertNodeを呼び出して必要な処理を実行する
        range.setStartAfter(textNode);
        // 「range.setStartAfter(textNode);」: range.setStartAfterを呼び出して必要な処理を実行する
        range.collapse(true);
        // 「range.collapse(true);」: range.collapseを呼び出して必要な処理を実行する
        sel.removeAllRanges();
        // 「sel.removeAllRanges(【引数】);」: sel.removeAllRangesを呼び出して必要な処理を実行する
        sel.addRange(range);
        // 「sel.addRange(range);」: sel.addRangeを呼び出して必要な処理を実行する
        processEditorContent();
        // 「processEditorContent(【引数】);」: processEditorContentを呼び出して必要な処理を実行する
        syncHiddenField();
        // 「syncHiddenField(【引数】);」: syncHiddenFieldを呼び出して必要な処理を実行する
        
        if (newModal.overlay) {
        // 「if (【条件】)」: 【条件】を判定する条件分岐
          newModal.overlay.classList.remove('is-open');
          // 「newModal.overlay.classList.remove('is-open');」: newModal.overlay.classList.removeを呼び出して必要な処理を実行する
          newModal.overlay.style.display = 'none';
          // 「newModal.overlay.style.display = 'none';」: newModal.overlay.style.displayの値を設定・更新する代入先
        }
      };
      
      const onCancel = () => {
      // 「const onCancel = () =>;」: onCancelを保持する変数
        if (newModal.overlay) {
        // 「if (【条件】)」: 【条件】を判定する条件分岐
          newModal.overlay.classList.remove('is-open');
          // 「newModal.overlay.classList.remove('is-open');」: newModal.overlay.classList.removeを呼び出して必要な処理を実行する
          newModal.overlay.style.display = 'none';
          // 「newModal.overlay.style.display = 'none';」: newModal.overlay.style.displayの値を設定・更新する代入先
        }
      };

      newModal.saveBtn.addEventListener('click', onSave);
      // 「newModal.saveBtn.addEventListener('click', onSave);」: newModal.saveBtn.addEventListenerを呼び出して必要な処理を実行する
      newModal.cancelBtn.addEventListener('click', onCancel);
      // 「newModal.cancelBtn.addEventListener('click', onCancel);」: newModal.cancelBtn.addEventListenerを呼び出して必要な処理を実行する
    });
  }

  // フォーム送信時に同期
  const form = bodyEditor.closest('form');
  // 「const form = bodyEditor.closest('form');」: formを保持する変数
  if (form) {
  // 「if (【条件】)」: 【条件】を判定する条件分岐
    form.addEventListener('submit', () => {
      syncHiddenField();
      // 「syncHiddenField(【引数】);」: syncHiddenFieldを呼び出して必要な処理を実行する
    });
  }

  if (bodySource && bodyHidden && bodySource.value !== bodyHidden.value) {
  // 「if (【条件】)」: 【条件】を判定する条件分岐
    bodySource.value = bodyHidden.value;
    // 「bodySource.value = bodyHidden.value;」: bodySource.valueの値を設定・更新する代入先
  }
}
