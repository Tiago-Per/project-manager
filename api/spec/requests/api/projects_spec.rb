require 'rails_helper'

RSpec.describe "Api::Projects", type: :request do
  let(:json) { response.parsed_body }
  let(:missing_id) { 0 }
  let(:png) { fixture_file_upload("cover.png", "image/png") }
  let(:jpg) { fixture_file_upload("cover.jpg", "image/jpeg") }
  let(:gif) { fixture_file_upload("cover.gif", "image/gif") }
  let(:valid_attributes) do
    { name: "Mobile App", client: "Globex", start_date: "2026-02-01", end_date: "2026-05-01" }
  end

  def names
    json["projects"].map { |project| project["name"] }
  end

  describe "GET /api/projects" do
    it "returns the projects and the meta total" do
      project = create(:project, name: "Website Redesign", client: "Acme Corp", favorite: true,
                                 start_date: Date.new(2026, 1, 1), end_date: Date.new(2026, 6, 30))

      get api_projects_path

      expect(response).to have_http_status(:ok)
      expect(json["projects"]).to eq([
        {
          "id" => project.id,
          "name" => "Website Redesign",
          "client" => "Acme Corp",
          "start_date" => "2026-01-01",
          "end_date" => "2026-06-30",
          "favorite" => true,
          "cover_url" => nil
        }
      ])
      expect(json["meta"]).to eq("total" => 1)
    end

    it "returns an empty list when there are no projects" do
      get api_projects_path

      expect(response).to have_http_status(:ok)
      expect(json["projects"]).to eq([])
      expect(json["meta"]).to eq("total" => 0)
    end

    it "includes an absolute cover_url for projects with a cover" do
      create(:project, cover: png)

      get api_projects_path

      expect(json["projects"].first["cover_url"]).to start_with("http://www.example.com/rails/active_storage/blobs/")
    end

    context "with the search param" do
      before do
        create(:project, name: "Website Redesign")
        create(:project, name: "Mobile App")
      end

      it "filters by name ignoring case" do
        get api_projects_path, params: { search: "WEBSITE" }

        expect(names).to eq([ "Website Redesign" ])
      end

      it "returns all projects when the term has fewer than 3 characters" do
        get api_projects_path, params: { search: "We" }

        expect(names).to eq([ "Mobile App", "Website Redesign" ])
      end

      it "keeps meta.total as the total number of projects" do
        get api_projects_path, params: { search: "WEBSITE" }

        expect(json["meta"]).to eq("total" => 2)
      end
    end

    context "with the favorite param" do
      before do
        create(:project, name: "Favorite Project", favorite: true)
        create(:project, name: "Regular Project", favorite: false)
      end

      it "returns only favorites when favorite=true" do
        get api_projects_path, params: { favorite: "true" }

        expect(names).to eq([ "Favorite Project" ])
        expect(json["meta"]).to eq("total" => 2)
      end

      it "does not filter when favorite is any other value" do
        get api_projects_path, params: { favorite: "false" }

        expect(names).to eq([ "Favorite Project", "Regular Project" ])
      end
    end

    context "with the sort param" do
      before do
        create(:project, name: "Alpha Project", start_date: Date.new(2026, 2, 1), end_date: Date.new(2026, 12, 1))
        create(:project, name: "Bravo Project", start_date: Date.new(2026, 3, 1), end_date: Date.new(2026, 4, 1))
        create(:project, name: "Charlie Project", start_date: Date.new(2026, 1, 1), end_date: Date.new(2026, 8, 1))
      end

      it "sorts by name by default" do
        get api_projects_path

        expect(names).to eq([ "Alpha Project", "Bravo Project", "Charlie Project" ])
      end

      it "sorts by start_date descending with sort=recent" do
        get api_projects_path, params: { sort: "recent" }

        expect(names).to eq([ "Bravo Project", "Alpha Project", "Charlie Project" ])
      end

      it "sorts by end_date ascending with sort=deadline" do
        get api_projects_path, params: { sort: "deadline" }

        expect(names).to eq([ "Bravo Project", "Charlie Project", "Alpha Project" ])
      end

      it "falls back to name for an unknown sort" do
        get api_projects_path, params: { sort: "unknown" }

        expect(names).to eq([ "Alpha Project", "Bravo Project", "Charlie Project" ])
      end
    end

    context "with tied sort values" do
      %w[name recent deadline].each do |sort|
        it "breaks ties by id with sort=#{sort}" do
          first = create(:project)
          second = create(:project)
          # Rewrites the row after the second one, so physical order differs from id order.
          first.touch

          get api_projects_path, params: { sort: sort }

          expect(json["projects"].map { |project| project["id"] }).to eq([ first.id, second.id ])
        end
      end
    end

    it "combines the search, favorite and sort params" do
      create(:project, name: "Website Alpha", favorite: true, start_date: Date.new(2026, 1, 1))
      create(:project, name: "Website Bravo", favorite: true, start_date: Date.new(2026, 2, 1))
      create(:project, name: "Website Charlie", favorite: false)
      create(:project, name: "Mobile App", favorite: true)

      get api_projects_path, params: { search: "website", favorite: "true", sort: "recent" }

      expect(names).to eq([ "Website Bravo", "Website Alpha" ])
      expect(json["meta"]).to eq("total" => 4)
    end
  end

  describe "GET /api/projects/:id" do
    it "returns the project" do
      project = create(:project)

      get api_project_path(project)

      expect(response).to have_http_status(:ok)
      expect(json).to include(
        "id" => project.id,
        "name" => project.name,
        "client" => project.client,
        "start_date" => project.start_date.iso8601,
        "end_date" => project.end_date.iso8601,
        "favorite" => false,
        "cover_url" => nil
      )
    end

    it "returns a cover_url that serves the uploaded file" do
      project = create(:project, cover: png)

      get api_project_path(project)
      cover_url = json["cover_url"]
      get cover_url

      expect(response).to have_http_status(:redirect)
      expect(response.location).to include("cover.png")
    end

    it "returns 404 when the project does not exist" do
      get api_project_path(missing_id)

      expect(response).to have_http_status(:not_found)
      expect(json).to eq("error" => "Project not found")
    end
  end

  describe "POST /api/projects" do
    it "creates the project and returns 201" do
      expect { post api_projects_path, params: { project: valid_attributes } }.to change(Project, :count).by(1)

      expect(response).to have_http_status(:created)
      expect(json).to include(
        "id" => Project.last.id,
        "name" => "Mobile App",
        "client" => "Globex",
        "start_date" => "2026-02-01",
        "end_date" => "2026-05-01",
        "favorite" => false,
        "cover_url" => nil
      )
    end

    it "accepts a JSON body" do
      post api_projects_path, params: { project: valid_attributes }, as: :json

      expect(response).to have_http_status(:created)
      expect(json["name"]).to eq("Mobile App")
    end

    it "uploads a PNG cover" do
      post api_projects_path, params: { project: valid_attributes.merge(cover: png) }

      expect(response).to have_http_status(:created)
      expect(Project.last.cover).to be_attached
      expect(Project.last.cover.content_type).to eq("image/png")
      expect(json["cover_url"]).to start_with("http://www.example.com/rails/active_storage/blobs/")
    end

    it "uploads a JPG cover" do
      post api_projects_path, params: { project: valid_attributes.merge(cover: jpg) }

      expect(response).to have_http_status(:created)
      expect(Project.last.cover.content_type).to eq("image/jpeg")
    end

    it "returns 422 with the validation errors on invalid data" do
      invalid = valid_attributes.merge(name: "Single", client: "", start_date: "2026-05-02")

      expect { post api_projects_path, params: { project: invalid } }.not_to change(Project, :count)

      expect(response).to have_http_status(:unprocessable_content)
      expect(json["errors"]).to eq(
        "name" => [ "must have at least two words" ],
        "client" => [ "can't be blank" ],
        "end_date" => [ "can't be before start date" ]
      )
    end

    it "returns 422 for an unparseable date" do
      post api_projects_path, params: { project: valid_attributes.merge(start_date: "not-a-date") }

      expect(response).to have_http_status(:unprocessable_content)
      expect(json["errors"]["start_date"]).to include("can't be blank")
    end

    it "returns 422 for a cover that is not a JPG or PNG" do
      expect { post api_projects_path, params: { project: valid_attributes.merge(cover: gif) } }
        .not_to change(Project, :count)

      expect(response).to have_http_status(:unprocessable_content)
      expect(json["errors"]["cover"]).to include("must be a JPG or PNG image")
    end

    it "returns 422 when cover is not a file" do
      post api_projects_path, params: { project: valid_attributes.merge(cover: "not-a-file") }

      expect(response).to have_http_status(:unprocessable_content)
      expect(json["errors"]["cover"]).to include("is invalid")
    end

    it "returns 400 when the project param is missing" do
      post api_projects_path, params: { name: "Mobile App" }

      expect(response).to have_http_status(:bad_request)
    end

    it "ignores unpermitted attributes" do
      post api_projects_path, params: { project: valid_attributes.merge(id: 999_999) }

      expect(response).to have_http_status(:created)
      expect(json["id"]).not_to eq(999_999)
    end

    it "ignores the favorite attribute" do
      post api_projects_path, params: { project: valid_attributes.merge(favorite: true) }

      expect(response).to have_http_status(:created)
      expect(json["favorite"]).to be(false)
    end
  end

  describe "PATCH /api/projects/:id" do
    let(:project) { create(:project, name: "Website Redesign") }

    it "updates the project" do
      patch api_project_path(project), params: { project: { name: "Website Rebuild" } }

      expect(response).to have_http_status(:ok)
      expect(json["name"]).to eq("Website Rebuild")
      expect(project.reload.name).to eq("Website Rebuild")
    end

    it "ignores the favorite attribute" do
      patch api_project_path(project), params: { project: { client: "Globex", favorite: true } }

      expect(response).to have_http_status(:ok)
      expect(json["client"]).to eq("Globex")
      expect(project.reload.favorite).to be(false)
    end

    it "uploads a cover" do
      patch api_project_path(project), params: { project: { cover: png } }

      expect(response).to have_http_status(:ok)
      expect(project.reload.cover).to be_attached
      expect(json["cover_url"]).to start_with("http://www.example.com/rails/active_storage/blobs/")
    end

    it "replaces an existing cover" do
      project.update!(cover: png)

      patch api_project_path(project), params: { project: { cover: jpg } }

      expect(response).to have_http_status(:ok)
      expect(project.reload.cover.content_type).to eq("image/jpeg")
    end

    it "keeps the cover when updating other attributes" do
      project.update!(cover: png)

      patch api_project_path(project), params: { project: { client: "Globex" } }

      expect(project.reload.cover).to be_attached
    end

    it "returns 422 with the validation errors on invalid data" do
      patch api_project_path(project), params: { project: { name: "Single" } }

      expect(response).to have_http_status(:unprocessable_content)
      expect(json["errors"]).to eq("name" => [ "must have at least two words" ])
      expect(project.reload.name).to eq("Website Redesign")
    end

    it "returns 422 and keeps the current cover for an invalid file" do
      project.update!(cover: png)

      patch api_project_path(project), params: { project: { cover: gif } }

      expect(response).to have_http_status(:unprocessable_content)
      expect(json["errors"]["cover"]).to include("must be a JPG or PNG image")
      expect(project.reload.cover.content_type).to eq("image/png")
    end

    it "returns 404 when the project does not exist" do
      patch api_project_path(missing_id), params: { project: { name: "Website Rebuild" } }

      expect(response).to have_http_status(:not_found)
      expect(json).to eq("error" => "Project not found")
    end
  end

  describe "DELETE /api/projects/:id" do
    it "deletes the project and returns 204" do
      project = create(:project)

      expect { delete api_project_path(project) }.to change(Project, :count).by(-1)

      expect(response).to have_http_status(:no_content)
      expect(response.body).to be_empty
    end

    it "deletes a project with a cover" do
      project = create(:project, cover: png)

      expect { delete api_project_path(project) }.to change(Project, :count).by(-1)

      expect(response).to have_http_status(:no_content)
    end

    it "returns 404 when the project does not exist" do
      delete api_project_path(missing_id)

      expect(response).to have_http_status(:not_found)
      expect(json).to eq("error" => "Project not found")
    end
  end
end
