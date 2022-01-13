/**
 * 
 * @file neos_chat_core.js for Neos chat
 * @author Sinduy <sjsanjsrh@naver.com>
 * @version 0.0.1
 * @copyright CC0
 * 
*/
const Neos = require("@bombitmanbomb/neosjs")
const neos = new Neos()

const express = require("express");
const app = express();
const path = require("path");
const _root = __dirname+"/_root"

app.use(express.static(path.join(_root, "/"))); 
app.use("/", (req, res)=>{
    res.sendFile(path.join(_root, "index.html"));
})
const server = app.listen(30001, ()=>{
    console.log("Server is Listening at 30001");
})
const socketIO = require("socket.io");
const io = socketIO(server, {path: "/socket.io"});

var friends = []

io.on("connect", (socket)=>{ 
    const ip = socket.request.headers["x-forwarded-for"] || socket.request.connection.remoteAddress;
    console.log(`클라이언트 연결 성공 - 클라이언트IP: ${ip}, 소켓ID: ${socket.id}`);

    socket.on("disconnect", (reason)=>{
        console.log(reason);
        console.log(`연결 종료 - 클라이언트IP: ${ip}, 소켓ID: ${socket.id}`)
        neos.Logout();
    });

    socket.on("error", (error)=>{
        console.log(`에러 발생: ${error}`);
    });

    socket.on("login_req", (data)=>{
        usr = JSON.parse(data)
        console.log(`login_req: ${usr.id}`);
        neos.Login(usr.id, usr.pw).then((res) => {
            console.log(`login: `+res);
            socket.emit("login_res", JSON.stringify(res))
        })
    });

    neos.on("login",(obj)=>{
        logindata = {CurrentUser: obj.CurrentUser, CurrentSession: obj.CurrentSession}
        console.log(logindata)
        socket.emit("login_data", JSON.stringify(logindata))
        socket.emit("friends", JSON.stringify(friends))
    });

    socket.on("client_msg", (data)=>{
        console.log(`client_msg: ${data}`);
        var message = JSON.parse(data)
        neos.SendTextMessage(message.Id,message.Content)
    });

    socket.on("client_msghis", (data)=>{
        console.log(`client_msghis: ${data}`);
        var message = JSON.parse(data)
        neos.GetMessageHistory(message.Id).then((messages) => {
            messages.forEach(element => {
                element._IsRead = element.IsRead
            });
            socket.emit("server_msghis", JSON.stringify(messages))
            
            neos.MarkMessagesRead(messages).then((res) => {
                console.log("MarkMessagesRead: ",res)
            })
        });
    });

    neos.on("messageReceived",(message)=>{
        // neos.SendTextMessage(message.SenderId,message.Content) // Reply recieved message back
        console.log("messageReceived: ",message.SenderId,message.Content)
        socket.emit("server_msg", JSON.stringify(message));
    })

    neos.on("friendAdded",(friend)=>{
        // if (friend.FriendStatus == "Requested") {
        //     neos.AddFriend(friend) // Accept the Friend Request
        //     console.log(friend) //New Friend
        // }
    
        let data = {
            Id: friend.FriendUserId,
            Name: friend.FriendUsername,
            Status: friend.UserStatus.OnlineStatus,
            IconUrl: friend.Profile.IconUrl
        }
        
        let i = friends.findIndex((element) =>
            element.Id == data.Id)
        if (i >= 0) friends.splice(i,1)
        friends.push(data)
        socket.emit("friends", JSON.stringify(friends))
    })
});

