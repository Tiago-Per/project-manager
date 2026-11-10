Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    resources :projects do
      resource :favorite, only: %i[create destroy], module: :projects
    end
  end
end
