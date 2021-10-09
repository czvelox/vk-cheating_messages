const axios = require('axios'), config = require('./config.json'), fs = require('fs');

const start = async () => {
    const peer_ids = []; // Массив с айдишниками для последующего использования в запросе
    for(let i = 0; i < 100; i++) peer_ids.push(config.group_id -= 1); // Закидываем в массив 100 айдишников (максимум в запросе)

    // Делаем запрос чатов с группами
    const { response: { items } } = await API("messages.getConversationsById", {peer_ids: peer_ids.join(","), peer_id: config.group_id});

    // Фильтруем массив от тех, у кого недоступна отправка сообщений и обходим его
    for(const item of items.filter(x => x.can_write.allowed)) {
        await new Promise(async resolve => {
            // Отправляем пустое сообщение в группу
            const { error } = await API("messages.send", {message: "&#13;", random_id: 0, peer_id: item.peer.id});

            if(!error) {
                await API("messages.markAsUnreadConversation", {peer_id: item.peer.id}); // Устанавливаем статус чата как непрочитанный
                console.log(`\x1b[32m> \x1b[0mСообщение отправлено | ID: ${item.peer.id}`);
            } else return console.log(`\x1b[31m> \x1b[0mСообщение не было отправлено | ID: ${item.peer.id} | ${error.error_msg} | Code: ${error.error_code}`);

            // Каждый раз сохраняем данные в конфиге, чтобы при последующем запуске оно продолжало работу, а не начинало заново
            fs.writeFileSync(__dirname + "/config.json", JSON.stringify({...config, group_id: item.peer.id}, null, 4));
            setTimeout(resolve, config.delay);
        })
    }

    start();
}

async function API(method, params) {
    return (await axios({url: "https://api.vk.com/method/" + method, method: "GET", params: {access_token: config.access_token, v: '5.131', ...params}})).data;
}

start();