# ============================================
# PostsController - 投稿機能のコントローラー
# ============================================
# 【役割】
# 投稿の作成・表示・編集・削除を行う
# 検索機能やタグ検索もここで管理
# ============================================

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
    # 公開済み（published）の投稿だけを取得して、新しい順に表示
    # includes(:user, :tags) で関連データを事前読み込み（N+1問題を防ぐ）
    @posts = Post.includes(:user, :tags).where(status: :published).order(created_at: :desc)
  end

  # =====================================
  # 詳細表示（誰でも見れる）
  # =====================================
  def show
    # @postはbefore_actionのset_postで取得済み
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
    if @post.update(post_params) # 更新成功
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
    # Ransackで検索条件を作成（例：タイトルや本文で検索）
    @q = Post.ransack(params[:q])
    
    # ***** 他のユーザーの下書きは表示しないフィルタリング *****
    # 公開投稿と、ログイン中ユーザーの下書きのみを取得
    posts = @q.result.includes(:user, :tags)
    
    if user_signed_in?
      # ログイン中：公開投稿 + 自分の下書き
      @posts = posts.where("status = ? OR user_id = ?", Post.statuses[:published], current_user.id)
    else
      # 未ログイン：公開投稿のみ
      @posts = posts.where(status: Post.statuses[:published])
    end
  end

  # =====================================
  # タグで絞り込み（誰でも見れる）
  # =====================================
  def tagged
    # URLから渡されたタグ名でタグを検索
    @tag = ActsAsTaggableOn::Tag.find_by(name: params[:tag])
    # そのタグが付いた投稿を取得
    @posts = Post.tagged_with(@tag.name) if @tag
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

  # =====================================
  # 画像URL取得API（JavaScript用）
  # =====================================
  def image_url
    # filename パラメータから画像を取得
    filename = params[:filename]
    
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

  # 権限チェック：自分の投稿または管理者のみ
  def ensure_correct_user
    # 投稿者本人 または 管理者 でなければアクセス拒否
    unless @post.user == current_user || current_user.admin?
      redirect_to posts_path, alert: '権限がありません。'
    end
  end
end
