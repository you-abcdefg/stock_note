require 'rails_helper'

RSpec.describe "Sessions", type: :request do
  describe "GET /guest_sign_in" do
    it "returns http success" do
      get "/sessions/guest_sign_in"
      expect(response).to have_http_status(:success)
    end
  end

end
