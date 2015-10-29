Wyncode: Week 6 homework
========================

I followed this tutorial by Sean Sellek and Ajaxified a Rails app!
=====================================================

Let's start by creating our rails app:

#In terminal:
rails new toodoo
Since we are looking to quickly prototype an app, this is the perfect opportunity to use scaffolding. We're going to need tasks to build a todo list. Navigate inside that app and generate a scaffold for tasks.

#In terminal:
cd toodoo
rails g scaffold task name --javascript-engine=js
This will generate a Task model with one attribute (name), a TasksController, and all the necessary controller actions and views to support it's basic CRUD operations.

Let's see our work so far. use rails s to start the sever, and navigate to localhost:3000. You should see an ActiveRecord:PendingMigrationError, which means we forgot to migrate! If you notice, rails built a migration file as part of it's scaffolding, and we need update our database accordingly:

#In terminal:
rake db:migrate
Visiting the page again, you'll see that Rail's default "Welcome Aboard!" page... not very useful for a todo app! Let's set the root path to the index action on our TasksController.

#In config/routes.rb
root to: 'tasks#index'
Everything should be working properly now. You can add, remove and edit tasks, as far as anyone is concerned, it's done!

Not so fast. Normally, that would be the case. But it doesn't take an engineer to realize that using our app is painful: Page refresh after page refresh for every single action. That's where the magic of AJAX comes into play. Instead of pulling a new page from the server for every action, AJAX is a technique in which we communicate with the server using javascript and modify the current page accordingly, without ever actually requesting a new page. Let's AJAXify our todo list.

First, we must include the ability to add a new todo list item right from the list page. Let's render our app views/tasks/_form.html.erb partial on our homepage:

# In app/views/tasks/index.html.erb
<h2>New Task</h2>
<%= render 'form' %>
Upon trying to view the result, however, we get an ArgumentError, First argument in form cannot contain nil or be empty. Our form partial includes the line form_for(@task), which is expecting a local variable, @task to exist as a new Task. Let's head up to our controller to prepare that local variable for our view.

#In app/controllers/tasks_controller.rb
def index
  @tasks = Task.all
  @task = Task.new
end
Good, except the form still reloads the page upon submission. Let's fix that by making the form AJAXy with Rails' remote: true form option.

#In app/views/tasks/_form.html.erb
<%= form_for(@task, remote: true) do |f| %>
Now we click submit and... nothing happends?

There is actually quite a bit going on. The form is successfully submitting itself via AJAX, and the controller is creating the task, but we haven't actually told our browser what to do at that point. If we reload the page, we can see the new task has been added. Let's prepare our javascript and tell our browser to refresh the page when the form is submitted.

The form emits an ajax:success event when it submits successfully, we need to add an event handler that listens for that event and responds accordingly. However, before we can bind that event handler to the form, we need to make sure the DOM is ready. Let's create a function that will run when the page is ready:

//in app/assets/javascripts/tasks.js
$(document).on("ready", ready);

function ready() {

}
Inside that function, let's add en event handler that will execute a function upon receiving the ajax:success event from the form with id `new_task:

//in app/assets/javascripts/tasks.js
function ready() {
  $('#new_task').on('ajax:success', newTask);
}
Finally, let's define that newTask function and have it reload the page when run:

//in app/assets/javascripts/tasks.js
function ready() {
  $('#new_task').on('ajax:success', newTask);

  function newTask() {
    window.location.reload();
  }
}
This works, but wasn't the whole point of AJAX to reduce page loading? Many events pass data to listening functions. Let's inspect these arguments to see what we can do with it.

//in app/assets/javascripts/tasks.js
function newTask() {
  console.log(arguments);
}
We can see that twe are receiving four arguments; the event itself, a bunch of HTML, the string "success", and an object. The second one seems interesting, upon further inspection, we see that the HTML code is actually the "Show Task" page that was rendered before we started AJAXifying things- It's the controller's response! This is great, but we don't want the controller to send us a whole new page, we want the controller to send us just info we need: information about the task we just created, not the entire page.

Let's turn off layout rendering for the Task#show action when we're using AJAX:

#In app/controllers/tasks_controller.rb
def show
  if request.xhr?
    render '_task', layout: false, locals: { task: @task }
  end
end
XHR stands for XML Http Request, it is a type of request that a browser makes to send HTTP or HTTPS requests to a web server and load the server response data back into the script. The request object in Rail's controller actions implements a .xhr? method that returns true if the request was an XHR request. So, we simply responded with a task partial and no layout. Let's define that task partial:

# In app/views/tasks/_task.html.erb
<p>
  <strong>Name:</strong>
  <%= @task.name %>
</p>
Now, reloading our page, we see that the data returned fromt the server is indeed the single task that was created. Now, let's handle this more useful response in javascript by adding it to the DOM. While we're at it, we can refactor this function to better handle the argument we want to use.

//in app/assets/javascripts/tasks.js

function newTask(event, data) {
  $('body').append(data);
}
Great! We've got the newly added task loading on our page. But it doesn't fit in too well with everything else. Let's use a list of tasks rather than a table in our index view.

#In app/views/tasks/index.html.erb
<h1>Listing Tasks</h1>

<ul id="tasks">
  <%= render @tasks %>
</ul>

<br>

<%= link_to 'New Task', new_task_path %>
Notice we used a powerful shorthand here. When we pass render an ActiveRecord Collection, the partial will be rendered once for every object in that collection. Like this:

render @task1
render @task2
#etc
In addition, when we pass render an instance of a model, it will automatically look for a partial of the same name, and render it with a local variable of that name, in our case, task:

render @task
render partial: 'task', object: @task
See Using partials, rendering collections.

Refreshing the page, we see that yes, the partials are rendering, but we're not correctly displaying the name. Our task partial expects an instance variable, @task, but instead, we're passing it a local variable, task. Let's fix that:

#In app/views/tasks/_task.html.erb
<p>
  <strong>Name:</strong>
  <%= link_to task.name, task %>
</p>
Now we've gotten things working, but we broke some rules along the way. We have an <ul> element whose children are not <li>. We're gonna fix that, but while we're at it, let's take advantage of the content_tag_for view helper.

#In app/views/tasks/_task.html.erb
<%= content_tag_for(:li, task) do %>
  <p>
    <strong>Name:</strong>
    <%= link_to task.name, task %>
  </p>
<% end %>
Now we're talking. Unfortunately, adding a new task still apends to the end of the page, let's make it actually append to the #tasks list:

//In app/assets/javascripts/tasks.js
$('#tasks').append(data);
Now, we'll start getting into details. For example, when we submit the new task form, it should clear out the text field. We already have a function handling the submission of this form, so all we have to do is add a one-liner there thanks to jQuery. We set the value of that form to an empty string:

//In app/assets/javascripts/tasks.js
$('#tasks').append(data);
$('#task_name').val('');
One last step is solving a problem that we might not notice right off the bat, but it's very important to be aware of. Remember that turbolinks speeds up using our application by making changes to the existing DOM while avoiding page refreshes when possible. This is great, but when we visit an individual task and then click the back link, a new "new task" form is injected into the existing DOM without a ready event being emitted from the document.

What does this mean? Our event listener is created inside of our ready function, which only runs on document ready. Thankfully, turbolinks provides us with another event we can listen for, page:load. Let's have our ready function run on page:load as well:

//In app/assets/javascripts/tasks.js
$(document).on("ready page:load", ready);
Now, everything works as expected. We were able to lean on Rails quite a bit to support our use of AJAX. We set remote: true on our form, and added a request.xhr? conditional in our controller to respond those requests differently. Finally, we used a few lines of javascript to add some client-side behavior that handled what is expected to happen after a form submission. Switch up some of our views to take more advantage of the modularity afforded by partials, and we were set!
