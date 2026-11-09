class CreateProjects < ActiveRecord::Migration[8.1]
  def change
    create_table :projects do |t|
      t.string :name, null: false
      t.string :client, null: false
      t.date :start_date, null: false
      t.date :end_date, null: false
      t.boolean :favorite, null: false, default: false

      t.timestamps
    end
    add_index :projects, :name
    add_index :projects, :start_date
    add_index :projects, :end_date
  end
end
