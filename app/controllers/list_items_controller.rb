class ListItemsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_list, only: [:update, :destroy, :move]
  before_action :ensure_list_owner!, only: [:update, :destroy, :move]
  before_action :set_list_item, only: [:update, :destroy, :move]

  def create_from_post
    post = Post.find(params[:id])

    unless post.user == current_user
      redirect_to post_path(post), alert: '投稿作成者のみリストに追加できます。'
      return
    end

    list = current_user.lists.find_by(id: params[:list_id])

    unless list
      redirect_to post_path(post), alert: '追加先リストが見つかりません。'
      return
    end

    @list_item = list.list_items.new(post: post)

    if @list_item.save
      redirect_to post_path(post), notice: 'リストに投稿を追加しました。'
    else
      redirect_to post_path(post), alert: @list_item.errors.full_messages.join(', ')
    end
  end

  def update
    if @list_item.update(list_item_params)
      redirect_to @list, notice: '投稿メモを更新しました。'
    else
      redirect_to @list, alert: @list_item.errors.full_messages.join(', ')
    end
  end

  def destroy
    @list_item.destroy
    normalize_positions
    redirect_to @list, notice: 'リストから投稿を削除しました。'
  end

  def move
    current_position = @list_item.position
    target_position = params[:direction] == 'up' ? @list_item.position - 1 : @list_item.position + 1
    swap_item = @list.list_items.find_by(position: target_position)

    if swap_item.present?
      ListItem.transaction do
        temporary_position = (@list.list_items.maximum(:position) || 0) + 1
        swap_item.update!(position: temporary_position)
        @list_item.update!(position: target_position)
        swap_item.update!(position: current_position)
      end
    end

    redirect_to @list
  end

  private

  def set_list
    @list = List.find(params[:list_id])
  end

  def set_list_item
    @list_item = @list.list_items.find(params[:id])
  end

  def ensure_list_owner!
    return if @list.owner?(current_user)

    redirect_to lists_path, alert: '権限がありません。'
  end

  def list_item_params
    params.require(:list_item).permit(:memo)
  end

  def normalize_positions
    @list.list_items.order(:position).each_with_index do |item, index|
      item.update_column(:position, index + 1)
    end
  end
end