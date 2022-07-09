/**
 * 
 * @file msg_theme.js for Neos chat
 * @author Sinduy <sjsanjsrh@naver.com>
 * 
*/
onSendMsg = ()=>{}
addMsg = ()=>{}
clearMsg = ()=>{}

var fillZero = function (number,n) {
    return ('0' + number).slice(-n)
}

class DateStruct{
    constructor(d){
            this.year = d.getFullYear()
            this.month = fillZero(d.getMonth() + 1,2)
            this.date = fillZero(d.getDate(),2)
            this.hour = fillZero(d.getHours(),2)
            this.minute = fillZero(d.getMinutes(),2)
            this.second = fillZero(d.getSeconds(),2)
    }
}
function convertTime(time){
    var d = new DateStruct(new Date(time))
    var am_pm = d.hour < 12?"AM":"PM"
    var hour12 = d.hour%12
    hour12 = fillZero(hour12==0?12:hour12,2)
    return (`${d.year}.${d.month}.${d.date}</br>${am_pm} ${hour12}:${d.minute}`)
}

$(function() {
    const input_msg = $("#input_msg")
    const msg_theme_main_msg = $("#msg_theme_main .msg")

    onSendMsg = ()=>{
        const id = $("#input_id")[0].value;
        const data = input_msg[0].value;
        socket.emit("client_msg", JSON.stringify({Id: id, Content: data}));
        var msg  = {
            self: true,
            html: printMessageContent("Text",data),
            time: convertTime(new Date()),
            isRead: false
        }
        addMsg(msg)
        input_msg[0].value = ""
    }
    
    clearMsg = ()=>{
        msg_theme_main_msg.empty()
    }

    addMsg = (msg)=>{
        var html = 
            `<div class="${msg.self?"mymsg":"othermsg"}${msg.isRead?"":" unread"}" `+
                `id=${msg.id}>\n`+
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

    input_msg.on('keydown', ()=>{
        if(event.keyCode==13){
            if(!event.shiftKey)
            {
                onSendMsg()
                this.value=''
                return false
            }
        }
    });
    input_msg.on('keydown keyup', ()=>{
        if($(this).height() < 128)
            $(this).height(1).height( $(this).prop('scrollHeight') )
    });
});