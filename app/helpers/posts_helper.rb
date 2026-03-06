require "redcarpet"
# require：Rubyのライブラリを読み込む
# "redcarpet"：MarkdownをHTMLへ変換するgem名

require "rouge"
# require：Rubyのライブラリを読み込む
# "rouge"：コードブロックの色付けに使うgem名

require "rouge/plugins/redcarpet"

require "base64"
require "json"
# require：Rubyのライブラリを読み込む
# "rouge/plugins/redcarpet"：Redcarpet向けのRouge拡張モジュール

module PostsHelper
  # module：ヘルパーメソッドをまとめるモジュール定義
  # PostsHelper：投稿表示関連のヘルパーメソッドを定義するモジュール名

  class MarkdownRenderer < Redcarpet::Render::HTML
    # class：クラス定義を開始
    # MarkdownRenderer：Markdown形式をHTMLにレンダリングするカスタムクラス名
    # Redcarpet::Render::HTML：HTML出力用レンダラーの親クラス（継承）
    include Rouge::Plugins::Redcarpet
    # include：モジュールの機能をクラスに取り込む
    # Rouge::Plugins::Redcarpet：コードブロックのシンタックスハイライト機能を有効化
  end
  # end：クラス定義を終了

  def render_post_body(post)
    # def：メソッド定義開始
    # render_post_body：投稿本文をMarkdownからHTMLに変換するメソッド名（showページ用）
    # post：変換対象の投稿オブジェクトを受け取るパラメータ
    return "" if post.body.blank?
    # return ""：空文字を返す（メソッド終了）
    # if：条件文
    # post.body.blank?：投稿の本文が空または空白のみかを判定

    body = if post.respond_to?(:body_document?) && post.body_document?
      card_document_to_legacy_body(post.body_document)
    else
      post.body.to_s
    end.gsub(/\r\n?/, "\n")
    # body：本文を処理用に複製して代入する変数
    # post.body：投稿の本文内容を取得
    # dup：文字列を複製して元データを保護（操作時の影響を防ぐ）

    # 新形式トークン [[sn-code:Base64]] および旧形式フェンス形式の両方を互換パース
    decode_card_payload = lambda do |encoded|
      # decode_card_payload: Base64エンコードされたJSONから構造化データを復号化する
      begin
        # begin: Base64デコードとJSON解析を試みる
        JSON.parse(Base64.strict_decode64(encoded.to_s))
        # Base64.strict_decode64: Base64文字列をバイナリに変換
        # JSON.parse: バイナリをJSON構造化オブジェクトに解析
      rescue ArgumentError, JSON::ParserError
        # rescue: Base64デコード失敗またはJSON形式不正の場合、安全にnilを返す
        nil
      end
    end

    # ● 数式テキストをHTML表示形式に変換してXSS対策を施す
    formula_to_html = lambda do |formula_text|
      # formula_to_html: 数式記法（[上,下]->基準 等）をHTML化してレンダリング
      build_formula_item = lambda do |base:, left_super: '', left_sub: '', right_super: nil, right_sub: nil, explicit_center: false|
        # build_formula_item: 基準文字と添え字部分からHTML spanを生成する内部関数
        has_left = left_super.present? || left_sub.present?
        # has_left: 左添え字（上下どちらか）が存在するかを判定
        has_right = right_super.present? || right_sub.present?
        # has_right: 右添え字（上下どちらか）が存在するかを判定
        left_len = [left_super.to_s.length, left_sub.to_s.length].max
        # left_len: 左添え字の最大文字数（配置幅計算用）
        right_len = [right_super.to_s.length, right_sub.to_s.length].max
        # right_len: 右添え字の最大文字数（配置幅計算用）

        left_width = has_left ? [0.72, (left_len * 0.34) + 0.28].max.round(2) : 0.0
        # left_width: 左添え字のCSS幅を桁数に応じて動的計算
        right_width = has_right ? [0.64, (right_len * 0.30) + 0.26].max.round(2) : 0.0
        # right_width: 右添え字のCSS幅を桁数に応じて動的計算

        max_len = [left_len, right_len, 1].max
        # max_len: 最大桁数を求める（レイアウト基準距離計算用）
        kern = (0.34 + (max_len - 1) * 0.17).round(2)
        # kern: 基準文字との間隔を桁数に応じて調整（小さいほど接近、大きいほど離隔）

        classes = ['formula-item']
        # classes: 数式要素のCSSクラス配列を初期化
        classes << 'formula-item-has-left' if has_left
        # classes <<: 左添え字が存在する場合はクラスを追加
        classes << 'formula-item-has-right' if has_right
        # classes <<: 右添え字が存在する場合はクラスを追加
        classes << 'formula-item-center-script' if explicit_center
        # classes <<: 中央配置オプション（Σなど大型演算子用）が使用された場合、クラスを追加
        style = "--formula-left-width: #{left_width}em; --formula-right-width: #{right_width}em; --formula-script-kern: #{kern}em;"
        # style: CSS変数として幅・間隔をinline style に埋め込む（動的レイアウト実現）

        # ● HTML出力時のXSS対策：すべての文字列値をHTMLエスケープ
        safe_base = ERB::Util.html_escape(base.to_s)
        # safe_base: 基準文字をエスケープして&lt; &gt; などの特殊文字を無害化
        safe_left_super = ERB::Util.html_escape(left_super.to_s)
        # safe_left_super: 左上付き文字をエスケープ
        safe_left_sub = ERB::Util.html_escape(left_sub.to_s)
        # safe_left_sub: 左下付き文字をエスケープ
        safe_right_super = ERB::Util.html_escape(right_super.to_s)
        # safe_right_super: 右上付き文字をエスケープ
        safe_right_sub = ERB::Util.html_escape(right_sub.to_s)
        # safe_right_sub: 右下付き文字をエスケープ

        result = "<span class='#{classes.join(' ')}' style='#{style}'>"
        # result: 計算済みクラス・スタイルを持つspan開始タグを生成
        result += "<span class='formula-left-super'>#{safe_left_super}</span>" if left_super.present?
        # result +=: 左上付き文字spanを追加（存在する場合のみ）
        result += "<span class='formula-left-sub'>#{safe_left_sub}</span>" if left_sub.present?
        # result +=: 左下付き文字spanを追加（存在する場合のみ）
        result += "<span class='formula-base'>#{safe_base}</span>"
        # result +=: 基準文字を中心に配置
        result += "<span class='formula-right-super'>#{safe_right_super}</span>" if right_super.present?
        # result +=: 右上付き文字spanを追加（存在する場合のみ）
        result += "<span class='formula-right-sub'>#{safe_right_sub}</span>" if right_sub.present?
        # result +=: 右下付き文字spanを追加（存在する場合のみ）
        result += "</span>"
        # result +=: span閉じタグで数式要素全体を完成
        result
      end

      formula_html = formula_text.to_s
      # formula_html: 数式テキストを初期化（処理ループ用の累積変数）

      # 左添え字パターン [上,下]->基準 をHTMLパターンに変換（正規表現置換）
      formula_html = formula_html.gsub(/\[([^,\]，]*)[,，]([^\]]*)\]\s*(?:->|→)\s*(\S+?)(?=\s|$|[^\w\[@<])/) do
        # gsub: グローバル置換（全マッチを処理）
        # パターン: [キャプチャ1,キャプチャ2]->キャプチャ3 をマッチして、矢印の前後で自動分割
        build_formula_item.call(base: $3, left_super: $1, left_sub: $2)
        # $1,$2,$3: パターン内の3つのキャプチャグループ（正規表現の括弧でマッチした部分）
      end

      # 右添え字パターン 基準<-[上,下] をHTMLパターンに変換
      formula_html = formula_html.gsub(/(\S+?)\s*(?:<-|←)\s*\[([^,\]，]*)[,，]([^\]]*)\](?=\s|$|[^\w])/) do
        # gsub: グローバル置換で全マッチを処理
        build_formula_item.call(base: $1, right_super: $2, right_sub: $3)
      end

      # 中央配置パターン 基準@[上,下] をHTMLパターンに変換
      formula_html = formula_html.gsub(/(\S+?)@\[([^,\]，]*)[,，]([^\]]*)\](?=\s|$|[^\w])/) do
        # gsub: グローバル置換で全マッチを処理
        build_formula_item.call(base: $1, right_super: $2, right_sub: $3, explicit_center: true)
        # explicit_center: trueを指定してΣなど大型演算子向けの中央配置を有効化
      end

      # 従来の簡易上付き：記号 ^1 → <sup>1</sup>  をHTML化
      formula_html = formula_html.gsub(/\^(\S+)/) { "<sup>#{ERB::Util.html_escape($1)}</sup>" }
      # gsub: キャプチャを&lt;・&gt;等でエスケープしてからsupタグWrap

      # 従来の簡易下付き： 記号 _i → <sub>i</sub> をHTML化
      formula_html = formula_html.gsub(/_(\S+)/) { "<sub>#{ERB::Util.html_escape($1)}</sub>" }
      # gsub: キャプチャをエスケープしてからsubタグWrap

      # 最終結果を数式用スタイルdivでWrapして返す
      "<div class='formula-display' style='padding: 8px 12px; background: #e8f4f8; border: 1px solid #b3d9e8; border-radius: 4px; font-family: \"Monaco\", \"Courier New\", monospace; font-size: 14px; line-height: 1.6; margin: 8px 0;'>#{formula_html}</div>"
    end

    # ● 新形式トークン [[sn-code:...]] をコードフェンス形式に変換してMarkdown処理へ
    body = body.gsub(/\[\[sn-code:([A-Za-z0-9+\/=]+)\]\]/) do
      # gsub: グローバル置換で全ての新形式コードトークンを処理
      payload = decode_card_payload.call($1)
      # $1: 正規表現の第1グループ（Base64部分）から構造化データを復号化
      next "" unless payload.is_a?(Hash)
      # next: payloadがHashでない場合（デコード失敗時）は空文字を返す

      code = payload['code'].to_s
      # code: JSON from Base64のcodeキーを取得して文字列化
      lang = payload['lang'].to_s.gsub(/[^a-zA-Z0-9_+#\.-]/, '')
      # lang: JSON from Base64のlangキーを取得して言語指定文字のみに制限（セキュリティ対策）
      max_ticks = code.scan(/`+/).map(&:length).max || 0
      # max_ticks: コード本文中のバッククォート連続数を計算して、フェンス記号数を決定
      fence = '`' * [3, max_ticks + 1].max
      # fence: 最小3個、または本文の最大連続バッククォート+1個のフェンス記号を生成
      info = lang.present? ? lang : ''
      # info: 言語指定があればlangを入れ、なければ空にする

      "#{fence}#{info}\n#{code}\n#{fence}"
      # return: Markdown準拠のコードフェンス形式 ```lang\\ncode\\n``` に変換して返す
    end

    # ● 新形式トークン [[sn-formula:...]] をHTML化してMarkdown処理をバイパス
    body = body.gsub(/\[\[sn-formula:([A-Za-z0-9+\/=]+)\]\]/) do
      # gsub: グローバル置換で全ての新形式数式トークンを処理
      payload = decode_card_payload.call($1)
      # $1: 正規表現の第1グループ（Base64部分）から構造化データを復号化
      next "" unless payload.is_a?(Hash)
      # next: payloadがHashでない場合（デコード失敗時）は空文字を返す

      formula_to_html.call(payload['formula'].to_s)
      # return: formula値を数式→HTMLラムダで処理して最終HTMLで返す（Markdownパーサをバイパス）
    end

    body = body.gsub(/\[\[sn-text:([A-Za-z0-9+\/=]+)\]\]/) do
      payload = decode_card_payload.call($1)
      next "" unless payload.is_a?(Hash)

      payload['text'].to_s
    end

    body = body.gsub(/\[\[sn-url:([A-Za-z0-9+\/=]+)\]\]/) do
      payload = decode_card_payload.call($1)
      next "" unless payload.is_a?(Hash)

      payload['url'].to_s
    end

    # ● 旧形式 ``formula...`` 記法も後方互換で対応
    body = body.gsub(/``formula\s*\ntext:([\s\S]*?)\n``/) do
      # gsub: グローバル置換で ``formula\\ntext:...\\n`` パターンを処理
      formula_to_html.call($1.to_s.strip)
      # $1: 正規表現の第1グループにマッチした数式テキストを抽出して処理
    end

    if post.respond_to?(:images) && post.images.attached?
      # if：条件分岐
      # post.respond_to?(:images)：投稿オブジェクトに:imagesメソッドが存在するかを確認
      # &&：AND演算子（両方の条件が真の場合のみ実行）
      # post.images.attached?：画像がActiveStorageに添付されているかを確認
      post.images.each do |image|
        # post.images：投稿に紐づく画像コレクションを取得
        # each：イテレータ（各要素に対して繰り返す）
        # image：ループ内の現在の画像オブジェクト
        image_url = url_for(image)
        # image_url：ActiveStorageの画像URLを生成
        safe_alt = ERB::Util.html_escape(image.filename.to_s)
        image_html = "<img src=\"#{image_url}\" alt=\"#{safe_alt}\" style=\"max-width: 100%; height: auto; border-radius: 4px; margin: 8px 0;\">"
        # image_html：シンプルな画像HTMLを生成（カード形式なし）
        # img src：画像URLを指定
        # style：画像のサイズと角丸、マージンを設定
        body = body.gsub(/!\[[^\]]*\]\(image:#{Regexp.escape(image.filename.to_s)}\)/, image_html)
        # body =：変更後の本文で変数を上書き
        # gsub：グローバル置換（全マッチを置換）
        # ![任意の説明](image:ファイル名)：Markdown画像記法を検索
        # Regexp.escape：ファイル名の正規表現メタ文字を無効化
        # image_html：シンプルなHTMLで置換
      end
      # end：eachブロック（ループ）を終了
    end
    # end：if条件ブロックを終了

    renderer = MarkdownRenderer.new(
      # renderer：Markdown変換用レンダラーをインスタンス化して変数に格納
      # MarkdownRenderer.new：作成したMarkdownRendererクラスのインスタンスを生成
      filter_html: false,
      # filter_html: false：HTMLタグの混入を許可
      hard_wrap: true,
      # hard_wrap: true：MarkdownのSoft改行を<br>タグに変換
      safe_links_only: true
      # safe_links_only: true：protocolが安全なリンク（http, https等）のみ許可
    )

    markdown = Redcarpet::Markdown.new(
      # markdown：Markdown変換器のインスタンスを生成して変数に格納
      # Redcarpet::Markdown.new：パーサと変換オプションを指定
      renderer,
      # renderer：上で生成したMarkdownRendererインスタンスを指定
      fenced_code_blocks: true,
      # fenced_code_blocks: true：```で囲まれたコードブロックを有効化（GFM対応）
      lax_spacing: true,
      # lax_spacing: true：段落直後のコードフェンスもブロックとして解釈
      no_intra_emphasis: true,
      # no_intra_emphasis: true：単語内アンダースコアを強調として処理しない
      tables: true,
      # tables: true：Markdown形式のテーブル記法を有効化
      autolink: true,
      # autolink: true：URLを自動的にハイパーリンク化
      strikethrough: true
      # strikethrough: true：~~で囲まれた打ち消し線テキストを有効化
    )

    html = markdown.render(body)
    # html：Markdownをレンダリング
    # markdown.render(body)：設定済みパーサで本文をHTML文字列に変換

    # ● HTML出力時の最終XSS対策：許可ホワイトリスト方式でサニタイズ
    ActionController::Base.helpers.sanitize(
      # sanitize: Rails標準のHTMLサニタイザーヘルパー関数
      # 機能：入力HTML文字列から許可タグ・許可属性のみを通し、その他を除去
      html,
      # html: Redcarpetが生成したHTML文字列を入力値として指定
      tags: %w[p br pre code div span sup sub img a strong em ul ol li blockquote table thead tbody tr th td h1 h2 h3 h4 h5 h6 hr],
      # tags: 許可する要素タグのホワイトリスト
      # 含まれるもの：段落・改行・リスト・テーブル・強調・上下付き・画像リンク等のセマンティック要素
      # 除外されるもの：script, style, iframe, object, embed, form, input, button 等の危険な要素
      attributes: %w[href src alt class style loading]
      # attributes: 許可する属性のホワイトリスト
      # 含まれるもの：href(リンク先), src(画像元), alt(説明), class(CSS), style(インライン), loading(遅延読み込み)
      # 除外されるもの：onclick, onload, onchange 等のイベントハンドラ（自動除去）
    )
    # return: サニタイズ済み安全HTMLを返す（Rails 7.x では .html_safe 扱いで出力可能）
  end

  def card_document_to_legacy_body(document)
    cards = Array(document['cards'])

    blocks = cards.filter_map do |card|
      next unless card.is_a?(Hash)

      case card['type'].to_s
      when 'text'
        card['content'].to_s
      when 'formula'
        payload = Base64.strict_encode64({ formula: card['content'].to_s }.to_json)
        "[[sn-formula:#{payload}]]"
      when 'code'
        payload = Base64.strict_encode64({ lang: card['lang'].to_s, code: card['content'].to_s }.to_json)
        "[[sn-code:#{payload}]]"
      when 'url'
        url = card['url'].to_s.strip
        next if url.blank?

        url
      when 'image'
        filename = card['filename'].to_s.strip
        next if filename.blank?

        "![説明](image:#{filename})"
      end
    end

    blocks.join("\n\n")
  end

end
# end：PostsHelperモジュール定義を終了
