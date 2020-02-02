var socket = io.connect();
var user = $('#login').val();
socket.on('connect',function()
{
    socket.emit('join_lobby',user);
})

socket.on('updateLobby',function(users,user)
{
    $('#onlineList').empty();
    for(var key in users){
        $('#onlineList').append('<li>'+key+'</li>')
    }
})