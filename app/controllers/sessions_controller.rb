  def guest_sign_in
    # ゲストユーザーを検索または作成
    guest_user = User.find_or_create_by!(email: 'guest@example.com') do |user|
      user.name = 'ゲストユーザー'
      user.password = SecureRandom.urlsafe_base64
      user.role = :guest
    end

    # ゲストユーザーとしてサインイン
    sign_in guest_user
    redirect_to root_path, notice: 'ゲストユーザーとしてログインしました。'
  end
