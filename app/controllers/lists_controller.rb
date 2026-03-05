class ListsController < ApplicationController
  before_action :authenticate_user!, except: [:index, :show]
  before_action :set_list, only: [:show, :edit, :update, :destroy]
  before_action :ensure_owner!, only: [:edit, :update, :destroy]

  def index
    @lists = List.viewable_by(current_user).includes(:user).order(created_at: :desc)
  end

  def show
    unless @list.viewable_by?(current_user)
      redirect_to lists_path, alert: 'このリストは非公開です。'
      return
    end

    @list_items = @list.list_items.includes(post: :user)
    return unless @list.owner?(current_user)
  end

  def new
    @list = current_user.lists.new
  end

  def create
    @list = current_user.lists.new(list_params)

    if @list.save
      redirect_to @list, notice: 'リストを作成しました。'
    else
      render :new
    end
  end

  def edit
  end

  def update
    if @list.update(list_params)
      redirect_to @list, notice: 'リストを更新しました。'
    else
      render :edit
    end
  end

  def destroy
    @list.destroy
    redirect_to lists_path, notice: 'リストを削除しました。'
  end

  private

  def set_list
    @list = List.find(params[:id])
  end

  def ensure_owner!
    return if @list.owner?(current_user)

    redirect_to lists_path, alert: '権限がありません。'
  end

  def list_params
    params.require(:list).permit(:title, :description, :visibility)
  end
end