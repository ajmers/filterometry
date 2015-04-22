require "instagram"
require "sinatra"
require "json"

set :haml, :format => :html5

get "/" do
    haml :index
end

get "/search" do
    haml :search
end

post "/search" do
    request_payload = JSON.parse '{"username":"amaiale"}'
    puts request_payload
    @username = request_payload["username"]
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
  config.client_id = "5045735e3c1b410c92cd246dbe8a9821"
  config.client_secret = "1a78b2fb6dca408a9e42f9fa01ee4d71"
  # For secured endpoints only
  #config.client_ips = '<Comma separated list of IPs>'
end


###### API ######
get '/api/users' do
    params = {}
    request_payload = JSON.parse '{"username":"amaiale"}'
    @username = request_payload["username"]
    puts request_payload

    client = Instagram.client(:access_token => session[:access_token])
    @users = client.user_search(@username)
    puts @users

    return @users.to_json
end

get '/api/photos' do
    client = Instagram.client(:access_token => session[:access_token])
    id = params[:id]
    puts id
    photos = Instagram.user_recent_media(id)
    return photos.to_json
end


