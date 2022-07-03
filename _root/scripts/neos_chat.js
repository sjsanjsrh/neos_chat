/**
 * 
 * @file neos_chat.js for Neos chat
 * @author Sinduy <sjsanjsrh@naver.com>
 * @version 0.0.2
 * @copyright CC0
 * 
*/
var DEBUG = true

const socket = io.connect("http://127.0.0.1:30001", 
    {path: "/socket.io", transports: ["websocket"]});
socket.on("connect", ()=>{ 
    console.log("연결 성공"); 
}); 
socket.on("disconnect", (reason)=>{ 
    console.log(reason); 
    console.log("연결 종료"); 
}); 
socket.on("error", (error)=>{ 
    console.log(`에러 발생: ${error}`); 
}); 

localUser = undefined;
friends = []
printMessageContent = ()=>{}

class MessageTableRow{
    constructor(row){
        this.icon = row.insertCell(0);
        this.usr  = row.insertCell(1);
        this.read = row.insertCell(2);
        this.cont = row.insertCell(3);
    }
}

function getIconURLAtNeosDBURL(url)
{
    return url.replace("neosdb:///", "https://cloudxstorage.blob.core.windows.net/assets/")
        .replace(/.\w*$/, "")
}

$(function() {
    var tb_friends = $("#tb_friends")[0];
    var tb_msgs = $("#tb_msgs")[0];

    socket.on("login_data", (data)=>{ 
        console.log(`login_data: ${data}`);
        res = JSON.parse(data)
        $("#login_main").css("display","none")
        $("#messenger_main").css("display","")
        $("body").css("overflow","")
        localUser = res.CurrentUser

        askNotificationPermission()
    });

    setUserID = function(Id){
        $("#input_id")[0].value = Id
        $("html").scrollTop(0)
        socket.emit("client_msghis", JSON.stringify({Id}));
    }

    socket.on("friend", (data)=>{ 
        if(DEBUG)console.log(`friend: ${data}`);
        friend = JSON.parse(data)

        let i = friends.findIndex((element) =>
            element.Id == friend.Id)
        if (i >= 0) friends.splice(i,1)
            friends.push(friend)

        friends.sort(function(a, b){
            var table = ["Requested", "Online", "Away", "Busy", "Offline"]
            return table.indexOf(a.Status) - table.indexOf(b.Status)
        });
        tb_friends.innerText=""
        friends.forEach(element => {
            var row = tb_friends.insertRow( tb_friends.rows.length ); // 하단에 추가
            var icon = row.insertCell(0);
            var name = row.insertCell(1);
            var id   = row.insertCell(2);
            var color = 
                element.Status == "Requested" ? "#000000" :
                element.Status == "Online" ? "#126b00" : 
                element.Status == "Away" ? "#a39800" : 
                element.Status == "Offline" ? "#525252" : "#a30000";
            name.innerHTML = `<a style= color:${color}`+
                               ` onclick="setUserID('${element.Id}');return false;"`+
                             ">"+element.Name+"</a>";
            id.innerHTML = element.Id;

            icon.innerHTML = element.IconUrl == undefined ? "" :
                             `<img class="ProfileIcon"`+
                                 ` src=`+getIconURLAtNeosDBURL(element.IconUrl)+
                                 ` alt="">`
        });
    });

    socket.on("server_msg", (data)=>{ 
        if(DEBUG)console.log(`server_msg: ${data}`);
        var message = JSON.parse(data)
        const id = $("#input_id")[0].value;
        if(id==message.SenderId){
            socket.emit("markMessagesRead", data);
        }
        else{
            // 다른 유저로부터 온 메시지 처리
            var text = message.MessageType === "Text" ? message.Content : message.MessageType
            var name = message.SenderId
            var neosIconURL = "https://cloudxstorage.blob.core.windows.net/assets/27095aed82033a1b36f4051f3bda0e654ff21c0f816f14bf3bb9d574f1f97a34"
            let i = friends.findIndex((element) =>
                element.Id == message.SenderId)
            if(i >= 0) {
                name = friends[i].Name
                if(message.IconUrl) neosIconURL = getIconURLAtNeosDBURL(message.IconUrl)
            }

            //if (Notification && Notification.permission === "granted") { // Worker 사용하여야함!
            if(false){
                
                var notification = new Notification(name, {icon: neosIconURL, body: text});
                setTimeout(notification.close.bind(notification), 4000);
                
                if(DEBUG)console.log(`Notification: ${name}: ${text}`);
            }
            else{
                alert(name + '\n' + text);
            }
        }
    });

    printMessageContent = (type, content)=>{
        switch (type){
            case "Object":
                var url
                var obj = JSON.parse(content)

                url = obj.thumbnailUri
                url = getIconURLAtNeosDBURL(url)
                img = `<img src=${url} title="${type}" style="height:128px">`
                
                if(obj.tags[1] == "photo" || obj.tags[1] == "image"){
                    // "texture_asset:neosdb:///80c974f0d01395ed44e54ca96965576800eb5ad5dc2eca190ba9ad860d0f89e6.webp"
                    var i = -1
                    for(var e = 2; e < obj.tags.length; e++){
                        if((/^texture_asset:/).test(obj.tags[e])){
                            i = e;
                            break;
                        }
                    }
                    if(i != -1){
                        harf = obj.tags[i].replace("texture_asset:","")
                        harf = getIconURLAtNeosDBURL(harf)
                        title = obj.tags[1]
                    }
                    return `<a href="${harf}" target="_blank">${img}</a>`;
                }
                return img;

            case "Sound":
                var obj = JSON.parse(content)
                var url = getIconURLAtNeosDBURL(obj.assetUri)

                return `<audio src="${url}" controls="controls"></audio>`;

            case "Text":
                return `<div style="white-space: pre-wrap">${content}</div>`;

            case "SessionInvite":
                var obj = JSON.parse(content)
                html =  `<img src="${obj.thumbnail}" title="${type}" style="width:128px"></br>` +
                        `<div style="color:darkgray">${obj.name}</div>`;

                return html;
            case "CreditTransfer":
                var obj = JSON.parse(content)
                html =  `<div style="color:darkgray"><b>${obj.token}</b></div>`+
                        `<div style="color:darkgray">${obj.amount}</div>`
                return html;
            default: 
                return `{${type}}`;
        }
    }

    socket.on("server_msghis", (data)=>{ 
        if(DEBUG)console.log(`server_msghis: ${data}`);
        var messages = JSON.parse(data)
        if(messages){
            clearMsg()
            messages.reverse()
            messages.forEach(message => {
                var msg = {
                    self: localUser.Id==message.SenderId,
                    html: printMessageContent(message.MessageType,message.Content),
                    time: convertTime(message.SendTime),
                    isRead: message._IsRead
                }
                addMsg(msg)
            });
        }
    });

    $("#loginForm")[0].onsubmit = function(){
        socket.emit("login_req", JSON.stringify({
            id: $("input[name='username']")[0].value, 
            pw: $("input[name='password']")[0].value
        }));
        return false;
    }

    socket.on("client_msg_res", (data)=>{
        const id = $("#input_id")[0].value;
        socket.emit("client_msghis", JSON.stringify({Id: id}));
    });

    // $("#btn_send")[0].onclick = function(){
    //     const id = $("#input_id")[0].value;
    //     input_msg = $("#input_msg")[0]
    //     const msg = input_msg.value;
    //     socket.emit("client_msg", JSON.stringify({Id: id, Content: msg}));
    //     var row = new MessageTableRow(tb_msgs.insertRow(tb_msgs.rows.length)); // 하단에 추가
    //     row.usr.innerHTML = "self";
    //     row.cont.innerHTML = msg;
    //     input_msg.value = "";
    // }

    $("#btn_history")[0].onclick = function(){
        const id = $("#input_id")[0].value;
        socket.emit("client_msghis", JSON.stringify({Id: id}));
    }
})

function checkNotificationPromise() {
    try {
        Notification.requestPermission().then();
    } catch(e) {
        return false;
    }

    return true;
}

function askNotificationPermission() {
    // 권한을 실제로 요구하는 함수
    function handlePermission(permission) {
        // 사용자의 응답에 관계 없이 크롬이 정보를 저장할 수 있도록 함
        if(!('permission' in Notification)) {
            Notification.permission = permission;
        }
    
        // 사용자 응답에 따라 단추를 보이거나 숨기도록 설정
        if(!(Notification.permission === 'denied' || Notification.permission === 'default')) {
            return;
        }
    }
  
    // 브라우저가 알림을 지원하는지 확인
    if (!('Notification' in window)) {
        console.log("이 브라우저는 알림을 지원하지 않습니다.");
    } else {
        if(checkNotificationPromise()) {
            Notification.requestPermission()
            .then((permission) => {
            handlePermission(permission);
            })
        } else {
            Notification.requestPermission(function(permission) {
            handlePermission(permission);
            });
        }
    }
}