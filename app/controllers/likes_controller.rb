# ============================================
# LikesController - いいね機能のコントローラー
# ============================================
# 【役割】
# 投稿に対する「いいね」の追加・削除・一覧表示を行う
# すべてのアクションでログイン必須
# ============================================

class LikesController < ApplicationController
  # すべてのアクションでログイン必須
  before_action :authenticate_user!
  
  # create、destroyの前に投稿を取得
  before_action :set_post

  # =====================================
  # いいねを作成（ログイン必須）
  # =====================================
  def create
    # 投稿に紐づけて「いいね」を作成
    @like = @post.likes.build
    # いいねしたユーザーをログイン中のユーザーに設定
    @like.user = current_user
    
    if @like.save # 保存成功
      redirect_to @post, notice: 'いいねしました。'
    else # 保存失敗（すでにいいね済みなど）
      redirect_to @post, alert: 'いいねに失敗しました。'
    end
  end

  # =====================================
  # いいねを削除（自分のいいねまたは管理者のみ）
  # =====================================
  def destroy
    # 削除対象のいいねを取得
    @like = @post.likes.find(params[:id])
    
    # 自分のいいね または 管理者のみ削除可能
    if @like.user == current_user || current_user.admin?
      @like.destroy
      redirect_to @post, notice: 'いいねを取り消しました。'
    else # 権限がない場合
      redirect_to @post, alert: '権限がありません。'
    end
  end

  # =====================================
  # 自分のいいね一覧表示（ログイン必須）
  # =====================================
  def index
    # ログイン中のユーザーのいいね一覧を取得
    # includes(:post) で投稿情報も一緒に取得（N+1問題を防ぐ）
    # page() でページネーション、per(10) で1ページ10件表示
    @likes = current_user.likes.includes(:post).page(params[:page]).per(10)
  end

  # =====================================
  # privateメソッド
  # =====================================
  private

  # いいね対象の投稿を取得
  def set_post
    # URLのpost_idから投稿を取得（例：/posts/1/likes）
    @post = Post.find(params[:post_id])
  end
end
