require 'rails_helper'

RSpec.describe "Admin::Comments", type: :request do
  describe "GET /admin/comments" do
    it "redirects to sign in" do
      get admin_comments_path
      expect(response).to have_http_status(:found)
    end
  end

  describe "DELETE /admin/comments/:id" do
    it "redirects to sign in" do
      delete admin_comment_path(1)
      expect(response).to have_http_status(:found)
    end
  end
end
