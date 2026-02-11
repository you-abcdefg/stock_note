# ***** pages_controller.rb - ページ管理コントローラー *****
# ***** 【このファイルの役割】 *****
# ***** Topページ・Aboutページなど、単純なコンテンツページを表示する *****

class PagesController < ApplicationController
  def top
    # ***** Topページを表示するアクション *****
    # Topページは認証なしでアクセス可能
  end

  def about
    # ***** Aboutページを表示するアクション *****
    # Aboutページは認証なしでアクセス可能
  end
end
