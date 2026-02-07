  before_action :authenticate_user!
  before_action :check_admin
  before_action :set_user, only: [:show, :edit, :update, :destroy]

  def index
    @q = User.ransack(params[:q])
    @users = @q.result(distinct: true).page(params[:page])
  end

  def show
  end

  def edit
  end

  def update
    if @user.update(user_params)
      redirect_to admin_users_path, notice: 'ユーザー情報を更新しました。'
    else
      render :edit
    end
  end

  def destroy
    if @user.destroy
      redirect_to admin_users_path, notice: 'ユーザーを削除しました。'
    else
      redirect_to admin_users_path, alert: 'ユーザーの削除に失敗しました。'
    end
  end

  private

  def set_user
    @user = User.find(params[:id])
  end

  def user_params
    params.require(:user).permit(:name, :email, :role)
  end

  def check_admin
    redirect_to root_path, alert: '権限がありません。' unless current_user&.admin?
  end
