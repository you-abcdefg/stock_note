require 'rails_helper'

RSpec.describe "Users", type: :request do
  let!(:user) do
    User.create!(
      email: 'users_spec_user@example.com',
      password: 'password123',
      password_confirmation: 'password123',
      name: 'Users Spec User',
      role: :general
    )
  end

  describe "GET /users" do
    it "returns http success" do
      get users_path
      expect(response).to have_http_status(:success)
    end
  end

  describe "GET /users/:id" do
    it "returns http success" do
      get user_path(user)
      expect(response).to have_http_status(:success)
    end
  end
end
