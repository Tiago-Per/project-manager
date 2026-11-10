require 'rails_helper'

RSpec.describe "Api::Projects::Favorites", type: :request do
  let(:json) { response.parsed_body }
  let(:missing_id) { 0 }

  describe "POST /api/projects/:project_id/favorite" do
    it "marks the project as favorite" do
      project = create(:project, favorite: false)

      post api_project_favorite_path(project)

      expect(response).to have_http_status(:ok)
      expect(json).to include("id" => project.id, "name" => project.name, "favorite" => true)
      expect(project.reload.favorite).to be(true)
    end

    it "keeps the same result when favoriting twice" do
      project = create(:project, favorite: false)

      2.times do
        post api_project_favorite_path(project)

        expect(response).to have_http_status(:ok)
        expect(response.parsed_body["favorite"]).to be(true)
        expect(project.reload.favorite).to be(true)
      end
    end

    it "returns 422 with the validation errors when the project is invalid" do
      project = create(:project, favorite: false)
      project.update_column(:name, "Single")

      post api_project_favorite_path(project)

      expect(response).to have_http_status(:unprocessable_content)
      expect(json["errors"]).to eq("name" => [ "must have at least two words" ])
      expect(project.reload.favorite).to be(false)
    end

    it "returns 404 when the project does not exist" do
      post api_project_favorite_path(missing_id)

      expect(response).to have_http_status(:not_found)
      expect(json).to eq("error" => "Project not found")
    end
  end

  describe "DELETE /api/projects/:project_id/favorite" do
    it "removes the favorite mark" do
      project = create(:project, favorite: true)

      delete api_project_favorite_path(project)

      expect(response).to have_http_status(:ok)
      expect(json).to include("id" => project.id, "favorite" => false)
      expect(project.reload.favorite).to be(false)
    end

    it "keeps the same result when unfavoriting twice" do
      project = create(:project, favorite: true)

      2.times do
        delete api_project_favorite_path(project)

        expect(response).to have_http_status(:ok)
        expect(response.parsed_body["favorite"]).to be(false)
        expect(project.reload.favorite).to be(false)
      end
    end

    it "returns 404 when the project does not exist" do
      delete api_project_favorite_path(missing_id)

      expect(response).to have_http_status(:not_found)
      expect(json).to eq("error" => "Project not found")
    end
  end
end
