/**
 * 
 * @file msg_theme.js for Neos chat
 * @author Sinduy <sjsanjsrh@naver.com>
 * @version 0.0.2
 * @copyright CC0
 * 
*/
onSendMsg = function(){}
addMsg = function(){}
clearMsg = function(){}

class DateStruct{
    constructor(d){
            var fillZero = function ( number ) {
                return ('0' + number).slice(-2);
            }
            this.year = d.getFullYear();
            this.month = fillZero(d.getMonth() + 1);
            this.date = fillZero(d.getDate());
            this.hour = fillZero(d.getHours());
            this.minute = fillZero(d.getMinutes());
            this.second = fillZero(d.getSeconds());
    }
}
function convertTime(time){
    var d = new DateStruct(new Date(time));
    return (`${d.year}.${d.month}.${d.date}</br>${d.hour}:${d.minute}`);
}

$(function() {
    const input_msg = $("#input_msg")
    const msg_theme_main_msg = $("#msg_theme_main .msg")

    onSendMsg = function(){
        const id = $("#input_id")[0].value;
        const data = input_msg[0].value;
        socket.emit("client_msg", JSON.stringify({Id: id, Content: data}));
        var msg  = {
            self: true,
            html: data,
            time: convertTime(new Date()),
            isRead: false
        }
        addMsg(msg)
    }
    
    clearMsg = function(){
        msg_theme_main_msg.empty()
    }

    addMsg = function(msg){
        var html = 
            `<div class="${msg.self?"mymsg":"othermsg"}${msg.isRead?"":" unread"}">\n`+
            `   <div class="box">\n`+
            (msg.self?
            `       <div class="time">${msg.time}</div>\n`:(""))+
            `       <div class="context">${msg.html}</div>\n`+
            (!msg.self?
            `       <div class="time"><div>${msg.time}</div></div>\n`:"")+
            `       <div class="clear"></div>\n`+
            `   </div>\n`+
            `</div>\n`+
            `<div class="blank"></div>`;
        
        msg_theme_main_msg.append(html)
        msg_theme_main_msg.scrollTop(msg_theme_main_msg[0].scrollHeight)
    }

    input_msg.on('keydown', function () {
        if(event.keyCode==13){
            if(!event.shiftKey)
            {
                onSendMsg()
                this.value=''
                return false
            }
        }
    });
    input_msg.on('keydown keyup', function () {
        if($(this).height() < 128)
            $(this).height(1).height( $(this).prop('scrollHeight') )
    });
});