require "instagram"
require "sinatra"
require "json"
require 'dotenv'

Dotenv.load

set :haml, :format => :html5

get "/" do
    haml :results
end

get "/search" do
    haml :results
end

post "/search" do
    puts params[:username]
    @username = params[:username]
    puts @username

    client = Instagram.client(:access_token => session[:access_token])
    puts @username
    @users = client.user_search(@username)
    puts @users
    haml :results
end

get "/user/:id" do
    client = Instagram.client(:access_token => session[:access_token])
    id = params[:id]
    puts id
    @user = Instagram.user(id)

    haml :user
end

Instagram.configure do |config|
  config.client_id = ENV["CLIENT_ID"]
  config.client_secret = ENV["CLIENT_SECRET"]
  # For secured endpoints only
  #config.client_ips = '<Comma separated list of IPs>'
end


###### API ######
get '/api/users' do
    @username = params[:data[:username]]

    client = Instagram.client(:access_token => session[:access_token])
    @users = client.user_search(@username)
    puts @users

    return @users.to_json
end

get '/api/photos' do
    client = Instagram.client(:access_token => session[:access_token])
    id = params[:id]
    max_id = params[:max_id] or nil

    photos = Instagram.user_recent_media(id, {:max_id => max_id})

    puts photos.length
    return photos.to_json
end

def get_last_id(photos)
    last_photo = photos[-1]
    puts last_photo
    if !last_photo.nil?
        last_photo_id = last_photo["id"]
        photo_id = last_photo_id.split('_')[0]
        return photo_id
    else
        return nil
    end
end

def get_next_batch(user_id, max_id)
    photos = Instagram.user_recent_media(user_id, {:max_id => max_id})
    return photos
end
