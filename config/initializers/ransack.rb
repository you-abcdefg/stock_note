# Ransack設定
# ActsAsTaggableOnのモデルをRansackで検索可能にする

# Tagモデルの検索可能属性を定義
ActsAsTaggableOn::Tag.class_eval do
  def self.ransackable_attributes(auth_object = nil)
    # id, name, created_at, updated_at, taggings_count を検索可能にする
    ["created_at", "id", "name", "taggings_count", "updated_at"]
  end

  def self.ransackable_associations(auth_object = nil)
    # taggings（タグ付け）関連を検索可能にする
    ["taggings"]
  end
end

# Taggingモデルの検索可能属性を定義
ActsAsTaggableOn::Tagging.class_eval do
  def self.ransackable_attributes(auth_object = nil)
    # context, tag_id, taggable_id, taggable_type などを検索可能にする
    ["context", "created_at", "id", "tag_id", "taggable_id", "taggable_type", "tagger_id", "tagger_type"]
  end

  def self.ransackable_associations(auth_object = nil)
    # tag, taggable, tagger 関連を検索可能にする
    ["tag", "taggable", "tagger"]
  end
end

# カスタムpredicateの定義：日付範囲の終了日を23:59:59まで含める
Ransack.configure do |config|
  # end_of_day predicate: 指定した日付の23:59:59まで含める
  config.add_predicate 'lteq_end_of_day',
    arel_predicate: 'lteq',
    formatter: proc { |v| v.end_of_day },
    validator: proc { |v| v.present? },
    type: :string
end
