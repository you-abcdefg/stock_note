require "redcarpet"
# require：Rubyのライブラリを読み込む
# "redcarpet"：MarkdownをHTMLへ変換するgem名

require "rouge"
# require：Rubyのライブラリを読み込む
# "rouge"：コードブロックの色付けに使うgem名

require "rouge/plugins/redcarpet"
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

    body = post.body.dup
    # body：本文を処理用に複製して代入する変数
    # post.body：投稿の本文内容を取得
    # dup：文字列を複製して元データを保護（操作時の影響を防ぐ）

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
        image_html = "<img src=\"#{image_url}\" alt=\"#{image.filename}\" style=\"max-width: 100%; height: auto; border-radius: 4px; margin: 8px 0;\">"
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

    html.html_safe
    # .html_safe：変換後のHTML文字列をRailsが安全として認識（XSS対策済み）
    # 戻り値：レンダリング後のHTML文字列を返す
  end

end
# end：PostsHelperモジュール定義を終了
