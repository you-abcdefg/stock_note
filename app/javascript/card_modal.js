// 画像カード用モーダル（URL入力＋プレビュー）
export function ensureMediaModal() {
  if (document.getElementById('media-editor-overlay')) {
    return {
      overlay: document.getElementById('media-editor-overlay'),
      fileInput: document.getElementById('media-editor-file'),
      preview: document.getElementById('media-editor-preview'),
      saveBtn: document.getElementById('media-editor-save'),
      cancelBtn: document.getElementById('media-editor-cancel')
    };
  }
  const overlay = document.createElement('div');
  overlay.id = 'media-editor-overlay';
  overlay.className = 'media-editor-overlay';
  overlay.innerHTML = `
    <div class="media-editor-modal">
      <div class="media-editor-header">
        <span>画像ファイルを選択</span>
      </div>
      <input id="media-editor-file" class="form-control" type="file" accept="image/*">
      <div style="margin:8px 0; text-align:center;">
        <img id="media-editor-preview" src="" alt="プレビュー" style="max-width:100%; max-height:200px; display:none; border:1px solid #ccc; border-radius:4px;" />
      </div>
      <div class="media-editor-actions">
        <button type="button" id="media-editor-cancel" class="btn btn-sm btn-outline-secondary">キャンセル</button>
        <button type="button" id="media-editor-save" class="btn btn-sm btn-primary">保存</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  const fileInput = overlay.querySelector('#media-editor-file');
  const preview = overlay.querySelector('#media-editor-preview');
  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        preview.src = e.target.result;
        preview.style.display = 'block';
      };
      reader.readAsDataURL(file);
    } else {
      preview.src = '';
      preview.style.display = 'none';
    }
  });
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.classList.remove('is-open');
      overlay.style.display = 'none';
    }
  });
  return {
    overlay,
    fileInput,
    preview,
    saveBtn: overlay.querySelector('#media-editor-save'),
    cancelBtn: overlay.querySelector('#media-editor-cancel')
  };
}

// 数式カード用モーダル（数式入力＋プレビュー）
export function ensureFormulaModalWithPreview() {
  if (document.getElementById('formula-preview-editor-overlay')) {
    return {
      overlay: document.getElementById('formula-preview-editor-overlay'),
      textarea: document.getElementById('formula-preview-editor-textarea'),
      preview: document.getElementById('formula-preview-editor-preview'),
      saveBtn: document.getElementById('formula-preview-editor-save'),
      cancelBtn: document.getElementById('formula-preview-editor-cancel')
    };
  }
  const overlay = document.createElement('div');
  overlay.id = 'formula-preview-editor-overlay';
  overlay.className = 'formula-editor-overlay';
  overlay.innerHTML = `
    <div class="formula-editor-modal">
      <div class="formula-editor-content">
        <div class="formula-editor-topbar" style="display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 8px; padding-bottom: 10px; border-bottom: 1px solid #ddd;">
          <div class="formula-editor-header" style="font-weight: 500;">
            <span>数式を挿入</span>
          </div>
          <div class="formula-editor-actions" style="display: flex; gap: 8px;">
            <button type="button" id="formula-preview-editor-cancel" class="btn btn-sm btn-outline-secondary">キャンセル</button>
            <button type="button" id="formula-preview-editor-save" class="btn btn-sm btn-primary">保存</button>
          </div>
        </div>
        <textarea id="formula-preview-editor-textarea" class="formula-editor-textarea" placeholder="例: a^2 + b^2 = c^2"></textarea>
        <div style="margin:8px 0; text-align:center;">
          <div id="formula-preview-editor-preview" style="min-height:32px; background:#f8f9fa; border-radius:4px; padding:8px;"></div>
        </div>
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
  // mainブランチのCSSもJSで注入
  if (!document.querySelector('style[data-formula-modal]')) {
    const style = document.createElement('style');
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
  const textarea = overlay.querySelector('#formula-preview-editor-textarea');
  const preview = overlay.querySelector('#formula-preview-editor-preview');
  textarea.addEventListener('input', () => {
    const formula = textarea.value.trim();
    preview.innerHTML = renderFormulaPreview(formula);
  });

  // 入力形式を変換してHTMLにする関数
  function renderFormulaPreview(input) {
    if (!input) return '';
    let out = input;
    // 右上付き: x^2 → x<sup>2</sup>
    out = out.replace(/([a-zA-Z0-9])\^([a-zA-Z0-9]+)/g, (m, base, sup) => `${base}<sup>${toSup(sup)}</sup>`);
    // 右下付き: a_1 → a<sub>1</sub>
    out = out.replace(/([a-zA-Z0-9])_([a-zA-Z0-9]+)/g, (m, base, sub) => `${base}<sub>${toSub(sub)}</sub>`);
    // 左添え字: [235,92]->U → ²³⁵₉₂U
    out = out.replace(/\[([\d,]+)\]->([a-zA-Z0-9])/g, (m, nums, base) => {
      const [sup, sub] = nums.split(',');
      return `${toSup(sup)}${toSub(sub)}${base}`;
    });
    // 右添え字: x<-[2,i] → x²ᵢ
    out = out.replace(/([a-zA-Z0-9])<-\[([\d,a-zA-Z]+)\]/g, (m, base, nums) => {
      const [sup, sub] = nums.split(',');
      return `${base}${toSup(sup)}${toSub(sub)}`;
    });
    // 中央配置: Σ@[n,i=1] → Σⁿᵢ₌₁
    out = out.replace(/([a-zA-Z0-9])@\[([^,\]]+),([^\]]+)\]/g, (m, base, sup, sub) => `${base}<sup>${toSup(sup)}</sup><sub>${toSub(sub)}</sub>`);
    return out;
  }

  // 上付き文字変換
  function toSup(str) {
    const map = {'0':' ','1':' b9','2':' b2','3':' b3','4':'074','5':'075','6':'076','7':'077','8':'078','9':'079','+':'07a','-':'07b','=':'07c','(':'07d',')':'07e','n':'713','i':'130'};
    return (str||'').split('').map(c=>map[c]||c).join('');
  }
  // 下付き文字変換
  function toSub(str) {
    const map = {'0':'080','1':'081','2':'082','3':'083','4':'084','5':'085','6':'086','7':'087','8':'088','9':'089','+':'090','-':'091','=':'092','(':'093',')':'094','n':'060','i':'d62'};
    return (str||'').split('').map(c=>map[c]||c).join('');
  }
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.classList.remove('is-open');
      overlay.style.display = 'none';
    }
  });
  return {
    overlay,
    textarea,
    preview,
    saveBtn: overlay.querySelector('#formula-preview-editor-save'),
    cancelBtn: overlay.querySelector('#formula-preview-editor-cancel')
  };
}
// モーダル（編集・プレビュー等）の生成・制御

export function ensureFormulaModal() {
  if (document.getElementById('formula-editor-overlay')) {
    return {
      overlay: document.getElementById('formula-editor-overlay'),
      textarea: document.getElementById('formula-editor-textarea'),
      saveBtn: document.getElementById('formula-save'),
      cancelBtn: document.getElementById('formula-cancel')
    };
  }
  // モーダルがなければ生成
  const overlay = document.createElement('div');
  overlay.id = 'formula-editor-overlay';
  overlay.className = 'formula-editor-overlay';
  overlay.innerHTML = `
    <div class="formula-editor-modal">
      <div class="formula-editor-header">
        <span>数式を編集</span>
      </div>
      <textarea id="formula-editor-textarea" class="formula-editor-textarea"></textarea>
      <div class="formula-editor-actions">
        <button type="button" id="formula-cancel" class="btn btn-sm btn-outline-secondary">キャンセル</button>
        <button type="button" id="formula-save" class="btn btn-sm btn-primary">保存</button>
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
    textarea: overlay.querySelector('#formula-editor-textarea'),
    saveBtn: overlay.querySelector('#formula-save'),
    cancelBtn: overlay.querySelector('#formula-cancel')
  };
}

export function ensureCodeModal() {
  if (document.getElementById('code-editor-overlay')) {
    return {
      overlay: document.getElementById('code-editor-overlay'),
      textarea: document.getElementById('code-editor-textarea'),
      saveBtn: document.getElementById('code-editor-save'),
      cancelBtn: document.getElementById('code-editor-cancel')
    };
  }
  // モーダルがなければ生成
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
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.classList.remove('is-open');
      overlay.style.display = 'none';
    }
  });
  return {
    overlay,
    textarea: overlay.querySelector('#code-editor-textarea'),
    saveBtn: overlay.querySelector('#code-editor-save'),
    cancelBtn: overlay.querySelector('#code-editor-cancel')
  };
}

export function ensureTextModal() {
  if (document.getElementById('text-editor-overlay')) {
    return {
      overlay: document.getElementById('text-editor-overlay'),
      textarea: document.getElementById('text-editor-textarea'),
      saveBtn: document.getElementById('text-editor-save'),
      cancelBtn: document.getElementById('text-editor-cancel')
    };
  }
  // モーダルがなければ生成
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
}

export function ensurePreviewModal() {
  if (document.getElementById('post-preview-overlay')) {
    return {
      overlay: document.getElementById('post-preview-overlay'),
      body: document.getElementById('post-preview-body'),
      closeBtn: document.getElementById('post-preview-close')
    };
  }
  // ...（元のプレビューモーダル生成処理をここに移植）...
}
