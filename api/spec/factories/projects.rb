FactoryBot.define do
  factory :project do
    name { "Website Redesign" }
    client { "Acme Corp" }
    start_date { Date.new(2026, 1, 1) }
    end_date { Date.new(2026, 6, 30) }
  end
end
