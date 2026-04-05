require 'rails_helper'

RSpec.describe "Admin::Users", type: :request do
  describe "GET /admin/users" do
    it "redirects to sign in" do
      get admin_users_path
      expect(response).to have_http_status(:found)
    end
  end

  describe "GET /admin/users/:id" do
    it "redirects to sign in" do
      get admin_user_path(1)
      expect(response).to have_http_status(:found)
    end
  end

  describe "GET /admin/users/:id/edit" do
    it "redirects to sign in" do
      get edit_admin_user_path(1)
      expect(response).to have_http_status(:found)
    end
  end

  describe "PATCH /admin/users/:id" do
    it "redirects to sign in" do
      patch admin_user_path(1), params: { user: { name: 'Updated' } }
      expect(response).to have_http_status(:found)
    end
  end

  describe "DELETE /admin/users/:id" do
    it "redirects to sign in" do
      delete admin_user_path(1)
      expect(response).to have_http_status(:found)
    end
  end
end
