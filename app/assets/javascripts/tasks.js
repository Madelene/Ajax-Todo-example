// Place all the behaviors and hooks related to the matching controller here.
// All this logic will automatically be available in application.js.
$(document).on("ready", ready);

function ready() {
    $('#new_task').on('ajax:success', newTask);



// function newTask() {
//   window.location.reload();
//   console.log(arguments);
//   }
}

function newTask(event, data) {
  // $('body').append(data);
$('#tasks').append(data);
$('#task_name').val(' ');
  }

