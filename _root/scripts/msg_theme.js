/**
 * 
 * @file msg_theme.js for Neos chat
 * @author Sinduy <sjsanjsrh@naver.com>
 * @version 0.0.2
 * @copyright CC0
 * 
*/

onSendMsg = function(){
    // TODO: call send massege function at neos_chat.js
}

$(function() {
    const input_msg = $("#input_msg")

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
        $(this).height(1).height( $(this).prop('scrollHeight') )
        // TODO: height max 제한
    });
});