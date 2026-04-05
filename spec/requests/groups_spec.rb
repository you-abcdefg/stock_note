require 'rails_helper'

RSpec.describe "Groups", type: :request do
  let!(:group) { Group.create!(name: 'Sample Group', description: 'desc') }

  describe "GET /groups" do
    it "returns http success" do
      get groups_path
      expect(response).to have_http_status(:success)
    end
  end

  describe "GET /groups/:id" do
    it "returns http success" do
      get group_path(group)
      expect(response).to have_http_status(:success)
    end
  end

  describe "GET /groups/new" do
    it "redirects to sign in" do
      get new_group_path
      expect(response).to have_http_status(:found)
    end
  end

  describe "POST /groups" do
    it "redirects to sign in" do
      post groups_path, params: { group: { name: 'New Group', description: 'desc' } }
      expect(response).to have_http_status(:found)
    end
  end

  describe "GET /groups/:id/edit" do
    it "redirects to sign in" do
      get edit_group_path(group)
      expect(response).to have_http_status(:found)
    end
  end

  describe "PATCH /groups/:id" do
    it "redirects to sign in" do
      patch group_path(group), params: { group: { name: 'Updated Group' } }
      expect(response).to have_http_status(:found)
    end
  end

  describe "DELETE /groups/:id" do
    it "redirects to sign in" do
      delete group_path(group)
      expect(response).to have_http_status(:found)
    end
  end
end
