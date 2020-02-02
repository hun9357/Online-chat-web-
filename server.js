const{User}=require('./models');


const express = require('express');
const path = require('path');
const hbs = require('express-handlebars');
const session = require('express-session');
const bcrypt = require('bcrypt');

app = express();

const http = require('http').createServer(app);
const io = require('socket.io').listen(http);

app.io = io;

var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

app.set('view engine','html');
app.engine('html',hbs({
    extname: 'html',
    defaultLayout: 'main',
    layoutsDir:__dirname+'/views/layouts/',
    partialsDir:__dirname+'/views/partials'
}));

app.set('port',3002);

app.use(express.static(path.join(__dirname,'static')));

app.use(session({secret:"lakcnsklcnlkaw"}));


app.get('/home',(req,res)=>{
    res.render('home')
})
app.post('/home',(req,res)=>{
    let username = req.body.Username.trim();
    let pw = req.body.Password.trim();
    let errors = [];
    if(req.body.register){
        res.redirect('/register');
        return;
    }
    else
    {
        if(username.length ==0)
        {
            errors.push({msg:"Please enter username"});
        }
        if(pw.length ==0)
        {
            errors.push({msg:"Please enter password"});
        }
        User.findOne({where:{username:username}}).then(user=>{
            if(user)
            {
                bcrypt.compare(pw,user.password,(err,match)=>{
                    if(match)
                    {
                        req.session.login=user;
                        res.redirect('/lobby');
                    }
                    else
                    {
                        errors.push({msg:"Username and Password is incorrect"});
                        res.render('home',{
                            user:username,
                            errors:errors
                        })
                    }
                })
            }
            else{
                res.render('home',{
                    errors:errors
                })
            }
        })
    }    
})

app.get('/lobby',(req,res)=>{
    if(req.session.login)
    {
        res.render('lobby',{
            user:req.session.login
        })
    }
    else{
        res.redirect('/home')
    }
})

app.get('/register',(req,res)=>{
    res.render('register')
})

app.post('/register',(req,res)=>{
    let errors = [];
    let name = req.body.name.trim();
    let username = req.body.username.trim();
    let email = req.body.email.trim();
    let pw = req.body.password.trim();
    if(req.body.back){
        res.redirect('/home');
        return;
    }
    else
    {
        if(username.length == 0)
        {
            errors.push({msg:"Please enter username"});
        }
        if(name.length == 0)
        {
            errors.push({msg:"Please enter name"});
        }
        if(email.length ==0 )
        {
            errors.push({msg:"Please enter valid email address"})
        }
        User.findOne({where:{username:username}}).then(user=>{
            if(user == username)
            {
                errors.push({msg:"Username is taken"})
            }
            if(pw.length <6)
            {
                errors.push({msg:"Password must be at least 6 characters!"})
            } 
            if(errors.length!=0)
            {
                res.render('register',{
                    errors:errors
                })
            }else{
                User.create({
                    name:name,
                    mail:email,
                    username:username,
                    password:bcrypt.hashSync(pw,10)
                })
                res.redirect('/home')
            }
        })
    }
})
app.get('/logout',(req,res)=>{
    delete req.session.login;
    res.redirect('/home');
})
app.get('/room',(req,res)=>{
    res.render('room',{
        username:req.query.username,
        roomname:req.query.roomname
    })
})

var room={"lobby":{}};
io.sockets.on('connection',function(socket){
    socket.on('join_lobby',function(username){
        socket.username = username;
        socket.room = 'lobby';
        socket.join('lobby');
        //users[username]=username;
        room["lobby"][username] = username;
        io.emit('updateLobby',username,room);
    })
    socket.on('createRoom',function(roomname,username){
        room[roomname]={};
        room[roomname][username] = username;
        room[roomname]["online"] = 1;     
        io.in('lobby').emit('updateLobby',username,room);

    })
    socket.on('join_room',function(roomname,username){
        room[roomname][username] = username;
        var count = 0;
        for(var keys=roomname in room)
        {
            for(var keys2 in room[keys]){
                count++;
            }
        }
        room[roomname]["online"]=count-1;
        io.emit('updateLobby',username,room);
    })
    socket.on('in_room',function(username,roomname){
        socket.username = username;
        socket.room=roomname;
        socket.join(roomname);
        io.emit('joined',username);
    })
    socket.on('send',function(msg,username){
        io.emit('rcv',msg,username);
    })
    socket.on('disconnect',function(){
        delete room[socket.room][socket.username];
        if(socket.room!='lobby')
        {
            room[socket.room]['online'] -=1;
            io.in(socket.room).emit('left',socket.username);
            if(room[socket.room]['online']==0)
            {
                delete room[socket.room];
                io.in('lobby').emit('updateLobby',socket.username,room);
            }
        }
        else
        {
            io.in(socket.room).emit('updateLobby',socket.username,room);
        }
        //io.sockets.emit('udpateLobby',socket.username,room);
        socket.leave(socket.room);
    })
})

http.listen(3002,function(){
    console.log("Server is running..")
});