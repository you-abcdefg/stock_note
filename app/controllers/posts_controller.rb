# ============================================
# PostsController - 投稿機能のコントローラー
# ============================================
# 【役割】
# 投稿の作成・表示・編集・削除を行う
# 検索機能やタグ検索もここで管理
# ============================================

# OGP取得に使用
require "digest"
require "net/http"
require "uri"
require "resolv"
require "ipaddr"
require "cgi"

class PostsController < ApplicationController
  # ログインチェック：index（一覧）、show（詳細）、tagged（タグ検索）以外はログイン必須
  before_action :authenticate_user!, except: [:index, :show, :tagged]
  
  # 個別投稿を取得：show、edit、update、destroyの前に実行
  before_action :set_post, only: [:show, :edit, :update, :destroy]
  
  # 権限チェック：自分の投稿または管理者のみ編集・削除可能
  before_action :ensure_correct_user, only: [:edit, :update, :destroy]
  # タグ一覧を取得（新規・編集・バリデーション失敗時にも必要）
  before_action :set_available_tags, only: [:new, :edit, :create, :update]

  # =====================================
  # 一覧表示（誰でも見れる）
  # =====================================
  def index
    initialize_post_search
    @posts = apply_post_visibility(@q.result.includes(:user, :tags))
  end

  # =====================================
  # 詳細表示（誰でも見れる）
  # =====================================
  def show
    # @postはbefore_actionのset_postで取得済み
    if user_signed_in?
      @available_lists_for_post = current_user.lists.order(created_at: :desc)
    end
  end

  # =====================================
  # 新規作成画面（ログイン必須）
  # =====================================
  def new
    @post = Post.new # 空の投稿オブジェクトを作成
  end

  # =====================================
  # 投稿を保存（ログイン必須）
  # =====================================
  def create
    # current_user（ログイン中のユーザー）に紐づけて投稿を作成
    @post = current_user.posts.build(post_params)

    if @post.save # 保存成功
      redirect_to @post, notice: '投稿を作成しました。'
    else # 保存失敗（バリデーションエラーなど）
      render :new # 入力画面に戻る
    end
  end

  # =====================================
  # 編集画面（自分の投稿または管理者のみ）
  # =====================================
  def edit
    # @postはbefore_actionのset_postで取得済み
  end

  # =====================================
  # 投稿を更新（自分の投稿または管理者のみ）
  # =====================================
  def update
    # 画像以外のパラメータで更新（画像は別途追加処理）
    if @post.update(post_params.except(:images)) # 更新成功
      # 新しい画像があれば既存画像に追加（置き換えではなく追加）
      if params[:post][:images].present?
        @post.images.attach(params[:post][:images])
      end
      redirect_to @post, notice: '投稿を更新しました。'
    else # 更新失敗
      render :edit # 編集画面に戻る
    end
  end

  # =====================================
  # 投稿を削除（自分の投稿または管理者のみ）
  # =====================================
  def destroy
    @post.destroy # データベースから削除
    redirect_to posts_url, notice: '投稿を削除しました。'
  end

  # =====================================
  # 検索機能（Ransack使用）
  # =====================================
  def search
    initialize_post_search
    @posts = apply_post_visibility(@q.result.includes(:user, :tags))
  end

  # =====================================
  # タグで絞り込み（誰でも見れる）
  # =====================================
  def tagged
    # URLから渡されたタグ名でタグを検索
    @tag = ActsAsTaggableOn::Tag.find_by(name: params[:tag])

    if @tag
      # タグが存在する場合、Ransackで検索条件を作成
      @q = Post.tagged_with(@tag.name).ransack(params[:q])

      # ソート順が指定されていない場合は新しい順をデフォルトに
      @q.sorts = 'created_at desc' if @q.sorts.empty?

      # 検索結果を取得（公開済みのみ）
      @posts = @q.result.published_only.includes(:user, :tags)
    else
      @posts = []
    end
  end

  # =====================================
  # privateメソッド（コントローラー内でのみ使用）
  # =====================================
  private

  # 投稿を取得（show、edit、update、destroyで使用）
  def set_post
    # includes で関連データを事前読み込み（ユーザー、タグ、コメントとコメントのユーザー）
    @post = Post.includes(:user, :tags, comments: :user).find(params[:id])
  end

  # タグ一覧を取得
  def set_available_tags
    @available_tags = ActsAsTaggableOn::Tag.order(:name)
  end

  # 許可するパラメータを指定（セキュリティ対策）
  def post_params
    # title、body、status、tag_list、images を受け取る
    # images: [] は複数画像アップロードを許可する設定
    params.require(:post).permit(:title, :body, :status, images: [], tag_list: [])
    # params：リクエストパラメータ全体
    # require(:post)：postキーの存在を必須にする
    # permit：受け取る項目を限定する
    # :title：タイトルを許可する
    # :body：本文を許可する
    # :status：公開状態を許可する
    # images: []：複数画像の配列を許可する
    # tag_list: []：複数タグの配列を許可する
  end

  def initialize_post_search
    @q = Post.ransack(params[:q])
    @q.sorts = 'created_at desc' if @q.sorts.empty?
  end

  def apply_post_visibility(posts)
    posts.visible_to(current_user)
  end

  public

  # =====================================
  # 画像URL取得API（JavaScript用）
  # =====================================
  def image_url
    # filename パラメータから画像を取得
    filename = params[:filename].to_s
      .gsub(/[\u200B-\u200D\uFEFF]/, '')
      .strip

    # 全投稿から該当する画像を検索
    # find_by_filename を使用してファイル名から ActiveStorage の Blob を取得
    blob = ActiveStorage::Blob.find_by(filename: filename)

    if blob.present?
      # 画像が存在する場合、URLを返す
      begin
        render json: { url: url_for(blob) }
      rescue StandardError => e
        # URLの生成に失敗した場合
        render json: { url: nil, error: e.message }, status: :bad_request
      end
    else
      # 画像が見つからない場合、エラーレスポンス
      render json: { url: nil, error: 'Image not found' }, status: :not_found
    end
  end

  # =====================================
  # OGPプレビュー取得API（JavaScript用）
  # =====================================
  def ogp_preview
    normalized_url = normalize_external_url(params[:url])
    if normalized_url.blank?
      render json: { error: "Invalid URL" }, status: :bad_request
      return
    end

    key = "ogp:preview:v1:#{Digest::SHA256.hexdigest(normalized_url)}"
    metadata = Rails.cache.fetch(key, expires_in: 12.hours) do
      fetch_ogp_metadata_for_preview(normalized_url)
    end

    if metadata.present?
      render json: {
        url: metadata[:url].presence || normalized_url,
        title: metadata[:title].to_s,
        description: metadata[:description].to_s,
        image: metadata[:image].to_s,
        site_name: metadata[:site_name].to_s
      }
    else
      render json: {
        url: normalized_url,
        title: "",
        description: "",
        image: "",
        site_name: ""
      }
    end
  end

  private

  # 権限チェック：自分の投稿または管理者のみ
  def ensure_correct_user
    # 投稿者本人 または 管理者 でなければアクセス拒否
    unless @post.user == current_user || current_user.admin?
      redirect_to posts_path, alert: '権限がありません。'
    end
  end

  def normalize_external_url(url)
    value = url.to_s.strip
    return "" if value.blank?

    uri = URI.parse(value)
    uri = URI.parse("https://#{value}") if uri.scheme.blank?
    return "" unless %w[http https].include?(uri.scheme)
    return "" if uri.host.blank?

    uri.to_s
  rescue URI::InvalidURIError
    ""
  end

  def fetch_ogp_metadata_for_preview(url)
    return nil unless safe_remote_url?(url)

    final_url, html = http_get_html_with_redirect(url)
    return nil if html.blank?

    title = extract_meta_content(html, "property", "og:title")
    description = extract_meta_content(html, "property", "og:description")
    image = extract_meta_content(html, "property", "og:image")
    site_name = extract_meta_content(html, "property", "og:site_name")
    canonical = extract_meta_content(html, "property", "og:url")

    title = extract_title_tag(html) if title.blank?
    description = extract_meta_content(html, "name", "description") if description.blank?

    {
      url: resolve_relative_url(final_url, canonical) || final_url,
      title: title.to_s.strip,
      description: description.to_s.strip,
      image: resolve_relative_url(final_url, image).to_s,
      site_name: site_name.to_s.strip
    }
  rescue StandardError
    nil
  end

  def http_get_html_with_redirect(url, limit = 3)
    raise "too many redirects" if limit <= 0

    uri = URI.parse(url)
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = (uri.scheme == "https")
    http.open_timeout = 3
    http.read_timeout = 5
    http.write_timeout = 5 if http.respond_to?(:write_timeout=)

    request = Net::HTTP::Get.new(uri.request_uri)
    request["User-Agent"] = "StockNoteOGPPreview/1.0"
    request["Accept"] = "text/html,application/xhtml+xml"

    response = http.request(request)
    case response
    when Net::HTTPSuccess
      [uri.to_s, response.body.to_s[0, 400_000]]
    when Net::HTTPRedirection
      location = response["location"].to_s
      return [uri.to_s, nil] if location.blank?

      redirected = URI.join(uri.to_s, location).to_s
      return [uri.to_s, nil] unless safe_remote_url?(redirected)

      http_get_html_with_redirect(redirected, limit - 1)
    else
      [uri.to_s, nil]
    end
  end

  def extract_meta_content(html, attr_name, attr_value)
    pattern = /
      <meta
      [^>]*#{Regexp.escape(attr_name)}\s*=\s*["']#{Regexp.escape(attr_value)}["']
      [^>]*content\s*=\s*["']([^"']*)["']
      [^>]*>
    /imx
    match = html.match(pattern)
    if match.nil?
      reverse_pattern = /
        <meta
        [^>]*content\s*=\s*["']([^"']*)["']
        [^>]*#{Regexp.escape(attr_name)}\s*=\s*["']#{Regexp.escape(attr_value)}["']
        [^>]*>
      /imx
      match = html.match(reverse_pattern)
    end
    return nil unless match

    CGI.unescapeHTML(match[1].to_s.strip)
  end

  def extract_title_tag(html)
    match = html.match(/<title[^>]*>(.*?)<\/title>/im)
    return nil unless match

    CGI.unescapeHTML(match[1].to_s.gsub(/\s+/, " ").strip)
  end

  def resolve_relative_url(base_url, candidate)
    return nil if candidate.to_s.strip.blank?

    URI.join(base_url.to_s, candidate.to_s).to_s
  rescue URI::InvalidURIError
    nil
  end

  def safe_remote_url?(url)
    uri = URI.parse(url)
    return false unless %w[http https].include?(uri.scheme)

    host = uri.host.to_s
    return false if host.blank?
    return false if %w[localhost 127.0.0.1 ::1].include?(host)

    addrs = Resolv.getaddresses(host)
    return false if addrs.blank?

    addrs.none? do |addr|
      ip = IPAddr.new(addr)
      is_loopback = ip.respond_to?(:loopback?) ? ip.loopback? : false
      is_private = ip.respond_to?(:private?) ? ip.private? : false
      is_link_local = ip.respond_to?(:link_local?) ? ip.link_local? : false
      is_unspecified = if ip.respond_to?(:unspecified?)
        ip.unspecified?
      else
        %w[0.0.0.0 ::].include?(ip.to_s)
      end

      is_loopback || is_private || is_link_local || is_unspecified
    rescue IPAddr::InvalidAddressError
      true
    end
  rescue StandardError
    false
  end
end
