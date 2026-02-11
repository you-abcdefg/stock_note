# ***** tags_controller.rb - タグ管理コントローラー *****
# ***** 【このファイルの役割】 ***** 
# ***** タグの一覧表示機能を提供する *****

class TagsController < ApplicationController
  def index
    # ***** すべてのタグを取得するアクション *****
    # acts-as-taggable-onが提供するActsAsTaggableOn::Tagモデルを使用
    @tags = ActsAsTaggableOn::Tag.all.order('taggings_count DESC')
  end
end
