# ============================================
# GroupsController - グループ機能のコントローラー
# ============================================
# 【役割】
# グループ（カテゴリ・ジャンル）の作成・管理を行う
# グループへの参加・退出機能も提供
# ============================================

class GroupsController < ApplicationController
  # index（一覧）、show（詳細）以外はログイン必須
  before_action :authenticate_user!, except: [:index, :show]
  
  # 各アクションの前にグループを取得
  before_action :set_group, only: [:show, :edit, :update, :destroy, :join, :leave]

  # =====================================
  # グループ一覧表示（誰でも見れる）
  # =====================================
  def index
    # 全グループを新しい順に表示
    @groups = Group.all.order(created_at: :desc)
  end

  # =====================================
  # グループ詳細表示（誰でも見れる）
  # =====================================
  def show
    # このグループに紐づく公開済み投稿を新しい順で取得
    @posts = @group.posts.where(status: :published).order(created_at: :desc)
  end

  # =====================================
  # 新規作成画面（ログイン必須）
  # =====================================
  def new
    @group = Group.new # 空のグループオブジェクトを作成
  end

  # =====================================
  # グループを保存（ログイン必須）
  # =====================================
  def create
    @group = Group.new(group_params)
    
    if @group.save # 保存成功
      redirect_to @group, notice: 'グループを作成しました。'
    else # 保存失敗
      render :new # 入力画面に戻る
    end
  end

  # =====================================
  # 編集画面（ログイン必須）
  # =====================================
  def edit
    # @groupはbefore_actionのset_groupで取得済み
  end

  # =====================================
  # グループを更新（ログイン必須）
  # =====================================
  def update
    if @group.update(group_params) # 更新成功
      redirect_to @group, notice: 'グループを更新しました。'
    else # 更新失敗
      render :edit # 編集画面に戻る
    end
  end

  # =====================================
  # グループを削除（ログイン必須）
  # =====================================
  def destroy
    @group.destroy # データベースから削除
    redirect_to groups_url, notice: 'グループを削除しました。'
  end

  # =====================================
  # グループに参加（ログイン必須）
  # =====================================
  def join
    # ログイン中のユーザーをこのグループのメンバーに追加
    GroupMembership.create(user: current_user, group: @group)
    redirect_to @group, notice: 'グループに参加しました。'
  end

  # =====================================
  # グループから退出（ログイン必須）
  # =====================================
  def leave
    # ログイン中のユーザーのメンバーシップを削除
    # &.destroy は「見つかった場合のみ削除」（ぼっち演算子）
    GroupMembership.find_by(user: current_user, group: @group)&.destroy
    redirect_to @group, notice: 'グループから退出しました。'
  end

  # =====================================
  # privateメソッド
  # =====================================
  private

  # グループを取得
  def set_group
    # URLのidから対象グループを取得
    @group = Group.find(params[:id])
  end

  # 許可するパラメータを指定（セキュリティ対策）
  def group_params
    # name、description だけを受け取る
    params.require(:group).permit(:name, :description)
  end
end
