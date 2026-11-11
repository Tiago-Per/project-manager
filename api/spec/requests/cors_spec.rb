require 'rails_helper'

RSpec.describe "CORS", type: :request do
  let(:frontend) { "http://localhost:5173" }

  it "allows the local frontend by default" do
    get "/api/projects", headers: { "Origin" => frontend }

    expect(response.headers["Access-Control-Allow-Origin"]).to eq(frontend)
  end

  it "answers the preflight request of the local frontend" do
    options "/api/projects/1", headers: {
      "Origin" => frontend,
      "Access-Control-Request-Method" => "PATCH"
    }

    expect(response.headers["Access-Control-Allow-Origin"]).to eq(frontend)
    expect(response.headers["Access-Control-Allow-Methods"]).to include("PATCH")
  end

  it "does not allow other origins" do
    get "/api/projects", headers: { "Origin" => "http://evil.example.com" }

    expect(response.headers["Access-Control-Allow-Origin"]).to be_nil
  end
end
