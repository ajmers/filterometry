require "instagram"
require "sinatra"
require "json"
require "dotenv"

Dotenv.load

set :haml, :format => :html5
enable :sessions
CALLBACK_URL = ENV["CALLBACK_URL"]

get "/" do
    haml :signin
end

get "/oauth/connect" do
  redirect Instagram.authorize_url(:redirect_uri => CALLBACK_URL)
end

get "/oauth/callback" do
  response = Instagram.get_access_token(params[:code], :redirect_uri => CALLBACK_URL)
  session[:access_token] = response[:access_token]
  redirect "/search"
end

get "/search" do
    haml :results
end

post "/search" do
    @username = params[:username]

    client = Instagram.client(:access_token => session[:access_token])
    users = client.user_search(@username)
    haml :results
end

get "/user/:id" do
    haml :user
end

Instagram.configure do |config|
  config.client_id = ENV["CLIENT_ID"]
  config.client_secret = ENV["CLIENT_SECRET"]
  # For secured endpoints only
  #config.client_ips = '<Comma separated list of IPs>'
end


###### API ######
get '/api/user/:id' do
    id = params[:id]
    user = Instagram.user(id)
    user.to_json
end

get '/api/users' do
    @username = params[:username]

    client = Instagram.client(:access_token => session[:access_token])
    @users = client.user_search(@username)
    puts @users

    return @users.to_json
end

get '/api/photos' do
    #client = Instagram.client(:access_token => session[:access_token])
    #puts 'access token: ' << session[:access_token].inspect
    id = params[:id]
    puts id

    photos = Instagram.user_recent_media(id, {:access_token => session[:access_token], :max_id => params[:max_id]})
    photos.to_json
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
