# ============================================
# UsersController - ユーザー管理のコントローラー
# ============================================
# 【役割】
# ユーザーの一覧表示・詳細表示・削除を行う
# 削除は管理者のみ可能
# ============================================

class UsersController < ApplicationController
  # show、destroyの前にユーザーを取得
  before_action :set_user, only: [:show, :destroy]

  # =====================================
  # ユーザー一覧表示（誰でも見れる）
  # =====================================
  def index
    # 全ユーザーを新しい順に表示
    @users = User.all.order(created_at: :desc)
  end

  # =====================================
  # ユーザー詳細表示（誰でも見れる）
  # =====================================
  def show
    # ユーザーの投稿一覧を新しい順で取得
    @posts = @user.posts.order(created_at: :desc)
    
    # 管理者または本人以外は公開済み投稿のみ表示
    # （下書きや非公開投稿は見せない）
    unless current_user&.admin? || current_user == @user
      @posts = @posts.where(status: :published)
    end
  end

  # =====================================
  # ユーザー削除（管理者のみ）
  # =====================================
  def destroy
    # 管理者 かつ 自分自身ではない場合のみ削除可能
    if current_user.admin? && @user != current_user
      @user.destroy
      redirect_to users_path, notice: 'ユーザーを削除しました。'
    else # 権限がない、または自分自身を削除しようとした場合
      redirect_to users_path, alert: '権限がありません。'
    end
  end

  # =====================================
  # マイページ（現在のユーザープロフィール）
  # =====================================
  def mypage
    # ログインしているかチェック
    redirect_to root_path, alert: 'ログインしてください。' unless current_user
    
    # 現在のユーザーを設定
    @user = current_user
    
    # ユーザーの投稿一覧を新しい順で取得
    @posts = @user.posts.order(created_at: :desc)
  end

  # =====================================
  # ユーザー検索（Ransack使用）
  # =====================================
  def search
    # Ransackで検索条件を作成（例：名前やメールで検索）
    @q = User.ransack(params[:q])
    @users = @q.result # 検索結果を取得
  end

  # =====================================
  # privateメソッド
  # =====================================
  private

  # ユーザーを取得
  def set_user
    # URLのidから対象ユーザーを取得
    @user = User.find(params[:id])
  end
end
