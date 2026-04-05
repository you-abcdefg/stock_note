require 'rails_helper'

RSpec.describe "Sessions", type: :request do
  describe "POST /guest_sign_in" do
    it "redirects after guest sign in" do
      post guest_sign_in_path
      expect(response).to have_http_status(:found)
    end
  end
end
