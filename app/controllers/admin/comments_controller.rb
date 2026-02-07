  before_action :authenticate_user!
  before_action :check_admin

  def index
    @q = Comment.ransack(params[:q])
    @comments = @q.result(distinct: true).includes(:user, :post).page(params[:page])
  end

  def destroy
    @comment = Comment.find(params[:id])
    if @comment.destroy
      redirect_to admin_comments_path, notice: 'コメントを削除しました。'
    else
      redirect_to admin_comments_path, alert: 'コメントの削除に失敗しました。'
    end
  end

  private

  def check_admin
    redirect_to root_path, alert: '権限がありません。' unless current_user&.admin?
  end
