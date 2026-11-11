module Api
  class ProjectsController < ApplicationController
    rescue_from ActiveSupport::MessageVerifier::InvalidSignature, with: :render_invalid_cover

    before_action :set_project, only: %i[show update destroy]

    def index
      projects = Project.with_attached_cover.search(params[:search]).sorted_by(params[:sort])
      projects = projects.favorites if params[:favorite] == "true"
      projects = projects.to_a

      render json: {
        projects: projects.map { |project| serialize(project) },
        meta: { total: projects.size }
      }
    end

    def show
      render json: serialize(@project)
    end

    def create
      project = Project.new(project_params)

      if project.save
        render json: serialize(project), status: :created
      else
        render_validation_errors(project)
      end
    end

    def update
      if @project.update(project_params)
        render json: serialize(@project)
      else
        render_validation_errors(@project)
      end
    end

    def destroy
      @project.destroy!

      head :no_content
    end

    private

    def set_project
      @project = Project.find(params[:id])
    end

    def project_params
      params.expect(project: %i[name client start_date end_date cover remove_cover])
    end

    def render_invalid_cover
      render json: { errors: { cover: [ "is invalid" ] } }, status: :unprocessable_content
    end
  end
end
