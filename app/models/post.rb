class Post < ApplicationRecord
# class：モデルクラスを定義する
# Post：投稿モデルのクラス名
# ApplicationRecord：ActiveRecordの基底クラス
  # リレーションシップ
  belongs_to :user # 投稿者
  # belongs_to：1件の関連を持つ
  # :user：投稿者との関連名
  has_many :comments, dependent: :destroy # コメント
  # has_many：複数の関連を持つ
  # :comments：コメントとの関連名
  # dependent: :destroy：投稿削除時にコメントも削除する
  has_many :likes, dependent: :destroy # いいね
  # has_many：複数の関連を持つ
  # :likes：いいねとの関連名
  # dependent: :destroy：投稿削除時にいいねも削除する
  has_many :liked_users, through: :likes, source: :user # いいねしたユーザー
  # has_many：複数の関連を持つ
  # :liked_users：いいねしたユーザーの関連名
  # through: :likes：likes経由で取得する
  # source: :user：likesの参照先をuserにする
  has_many :post_groups, dependent: :destroy # グループ紐付け
  # has_many：複数の関連を持つ
  # :post_groups：中間テーブルとの関連名
  # dependent: :destroy：投稿削除時に紐付けも削除する
  has_many :groups, through: :post_groups # 所属グループ
  # has_many：複数の関連を持つ
  # :groups：グループとの関連名
  # through: :post_groups：中間テーブル経由で取得する

  # タグ機能を有効化（acts-as-taggable-on）
  acts_as_taggable_on :tags
  # acts_as_taggable_on：タグ機能を有効化する
  # :tags：タグの種類名

  # 投稿内に埋め込む画像（ActiveStorage）
  has_many_attached :images
  # has_many_attached：複数ファイルの添付を有効化する
  # :images：添付の関連名（投稿に紐づく画像）

  # ステータス（公開・下書き）
  enum status: { draft: 0, published: 1 }
  # enum：列挙型を定義する
  # status：ステータスの列名
  # draft: 0：下書きの値
  # published: 1：公開の値

  # 検索機能（Ransack用）
  def self.ransackable_attributes(auth_object = nil)
  # def self：クラスメソッドを定義する
  # ransackable_attributes：検索対象の属性を指定する
  # auth_object = nil：認可情報の引数
    ["title", "body", "status", "created_at", "updated_at"]
  end
  # end：メソッド定義を終了する

  def self.ransackable_associations(auth_object = nil)
  # def self：クラスメソッドを定義する
  # ransackable_associations：検索対象の関連を指定する
  # auth_object = nil：認可情報の引数
    ["user", "comments", "likes", "groups", "tags"]
  end
  # end：メソッド定義を終了する
  belongs_to :user
  # belongs_to：1件の関連を持つ
  # :user：投稿者との関連名
end
# end：クラス定義を終了する
