require "instagram"
require "sinatra"
require "json"
require "dotenv"
require 'sinatra/cross_origin'

enable :cross_origin

Dotenv.load

set :haml, :format => :html5
enable :sessions
CALLBACK_URL = ENV["CALLBACK_URL"]
REDIRECT_URL = "/"

get "/" do
    if !session[:access_token].nil?
        puts session[:access_token]
        @signed_in = true
    end
    haml :index
end

get "/oauth/connect" do
  redirect Instagram.authorize_url(:redirect_uri => CALLBACK_URL)
end

get "/oauth/callback" do
  response = Instagram.get_access_token(params[:code], :redirect_uri => CALLBACK_URL)
  session[:access_token] = response[:access_token]

  redirect REDIRECT_URL
end

get "/search" do
    REDIRECT_URL = "/search"
    puts session[:access_token]
    if !session[:access_token].nil?
        puts session[:access_token]
        @signed_in = true
    else
        puts session[:access_token]
        @signed_in = false
    end
    puts @signed_in

    haml :UserSearchResults
end

post "/search" do
    REDIRECT_URL = "/search"
    @username = params[:username]
    puts @username
    if !session[:access_token].nil?
        puts session[:access_token]
        @signed_in = true
    else
        @signed_in = false
    end

    haml :userSearchResults
end

get "/user/:id" do
    haml :photoResultsByUser
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

    begin
        user = Instagram.user(id)
    rescue Instagram::BadRequest
        status 400
        return {:error => '400'}.to_json
    end
    user.to_json
end

get '/api/users' do
    @username = params[:username]

    client = Instagram.client(:access_token => session[:access_token])
    @users = client.user_search(@username)
    puts @users

    return @users.to_json
end

get '/api/tag/:tagname' do
    tag = params[:tagname]

    client = Instagram.client(:access_token => session[:access_token])
    photos = client.tag_recent_media(tag)

    return photos.to_json
end

get '/api/tags/:tagname' do
    @tag = params[:tagname]

    client = Instagram.client(:access_token => session[:access_token])
    @tags = client.tag_search(@tag)
    puts @tags

    return @tags.to_json
end

get '/api/photos' do
    id = params[:id]
    puts id

    begin
        response = Instagram.user_recent_media(id, {:access_token => session[:access_token], :max_id => params[:max_id]})
    rescue Instagram::BadRequest
        status 400
        return {:error => '400'}.to_json
    end

    response.to_json
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
