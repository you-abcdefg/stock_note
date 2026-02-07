class User < ApplicationRecord
  # ユーザーの種類を定義（一般、管理者、ゲスト）
  enum role: { general: 0, admin: 1, guest: 2 }

  # ユーザー名を保存
  validates :name, presence: true, unless: :guest?

  # リレーションシップ
  has_many :posts, dependent: :destroy # 投稿を複数持つ
  has_many :comments, dependent: :destroy # コメントを複数持つ
  has_many :likes, dependent: :destroy # いいねを複数持つ
  has_many :liked_posts, through: :likes, source: :post # いいねした投稿
  has_many :group_memberships, dependent: :destroy # グループメンバーシップ
  has_many :groups, through: :group_memberships # 所属グループ

  # ゲストユーザーを作成するクラスメソッド
  def self.guest
    find_or_create_by!(email: 'guest@example.com') do |user|
      user.password = SecureRandom.urlsafe_base64
      user.name = 'ゲストユーザー'
      user.role = :guest
    end
  end

  # Ransack 検索許可設定
  def self.ransackable_attributes(auth_object = nil)
    ["name", "email", "created_at"]
  end

  def self.ransackable_associations(auth_object = nil)
    ["posts", "comments", "groups"]
  end
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable
end
