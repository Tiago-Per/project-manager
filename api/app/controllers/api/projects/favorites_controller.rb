module Api
  module Projects
    class FavoritesController < ApplicationController
      before_action :set_project

      def create
        @project.update!(favorite: true)

        render json: serialize(@project)
      end

      def destroy
        @project.update!(favorite: false)

        render json: serialize(@project)
      end

      private

      def set_project
        @project = Project.find(params[:project_id])
      end
    end
  end
end
