import { characters, eventSource, event_types, getRequestHeaders, messageFormatting, reloadCurrentChat, setCharacterId, substituteParams, this_chid } from '../../../../script.js';
import { groups, openGroupById, resetSelectedGroup } from '../../../group-chats.js';
import { delay } from '../../../utils.js';




const log = (...msg)=>console.log('[STL]', ...msg);

let dom;
const remDom = async()=>{
    dom?.remove();
    dom = null;
};
const makeDom = async()=>{
    remDom();
    dom = document.createElement('div'); {
        dom.classList.add('stlp--wrapper');
        const root = document.createElement('div'); {
            root.classList.add('stlp--chars');
            const chars = [...characters, ...groups].toSorted((a,b)=>b.date_last_chat - a.date_last_chat).slice(0, 5);
            chars.forEach(c=>{
                let lmCon;
                const char = document.createElement('div'); {
                    char.classList.add('stlp--char');
                    char.addEventListener('pointerenter', ()=>{
                        lmCon?.classList?.add('stlp--active');
                    });
                    char.addEventListener('pointerleave', ()=>{
                        lmCon?.classList?.remove('stlp--active');
                    });
                    char.addEventListener('click', async()=>{
                        if (c.members) {
                            openGroupById(c.id);
                        } else {
                            resetSelectedGroup();
                            setCharacterId(characters.findIndex(it=>it == c));
                            await delay(1);
                            await reloadCurrentChat();
                        }
                    });
                    const name = document.createElement('div'); {
                        name.classList.add('stlp--name');
                        name.textContent = c.name;
                        char.append(name);
                    }
                    const ava = document.createElement('div'); {
                        ava.classList.add('stlp--avatar');
                        if (c.members) {
                            ava.classList.add(`stlp--${Math.min(4, c.members.length)}`);
                            char.classList.add(`stlp--${Math.min(4, c.members.length)}`);
                            c.members.slice(0, 4).map(m=>characters.find(it=>it.avatar == m)).forEach((m, idx)=>{
                                const subAva = document.createElement('div'); {
                                    subAva.classList.add('stlp--sub');
                                    subAva.classList.add(`stlp--a${idx}`);
                                    subAva.style.backgroundImage = `url("/characters/${m.avatar}")`;
                                    ava.append(subAva);
                                    const url = `/characters/${m.name}/neutral.png`;
                                    fetch(url, { method:'HEAD' }).then(resp=>{
                                        if (resp.ok) {
                                            subAva.style.backgroundImage = `url("${url}")`;
                                        }
                                    });
                                }
                            });
                        } else {
                            ava.style.backgroundImage = `url("/characters/${c.avatar}")`;
                            const url = `/characters/${c.name}/neutral.png`;
                            fetch(url, { method:'HEAD' }).then(resp=>{
                                if (resp.ok) {
                                    ava.style.backgroundImage = `url("${url}")`;
                                }
                            });
                        }
                        char.append(ava);
                    }
                    fetch('/api/chats/get', {
                        method: 'POST',
                        headers: getRequestHeaders(),
                        body: JSON.stringify({
                            ch_name: c.name,
                            file_name: c.chat,
                            avatar_url: c.avatar,
                        }),
                        cache: 'no-cache',
                    }).then(async(resp)=>{
                        if (resp.ok) {
                            const mes = (await resp.json()).slice(-1)[0];
                            if (mes) {
                                const con = document.createElement('div'); {
                                    lmCon = con;
                                    con.classList.add('stlp--lastMes');
                                    con.classList.add('mes');
                                    const lm = document.createElement('div'); {
                                        lm.classList.add('stlp--lastMesContent');
                                        lm.classList.add('mes_text');
                                        let messageText = substituteParams(mes.mes);
                                        setCharacterId(-1);
                                        messageText = messageFormatting(
                                            messageText,
                                            mes.name,
                                            false,
                                            mes.is_user,
                                        );
                                        setCharacterId(undefined);
                                        lm.innerHTML = messageText;
                                        con.append(lm);
                                    }
                                    dom.append(con);
                                }
                            }
                        }
                    });
                    root.append(char);
                }
            });
            dom.append(root);
        }
        document.body.append(dom);
    }
};

const onChatChanged = (chatFile)=>{
    if (chatFile === undefined) {
        log('LANDING');
        document.querySelector('#sheld').style.display = 'none';
        makeDom();
    } else {
        remDom();
        document.querySelector('#sheld').style.display = '';
    }
};
onChatChanged(undefined);
eventSource.on(event_types.APP_READY, onChatChanged);
eventSource.on(event_types.CHAT_CHANGED, onChatChanged);







// registerSlashCommand('sc-up', ()=>jumpUp(), [], 'jump to nearest branch point upwards', true, true);




$(document).ready(function () {
    const addSettings = () => {
        const html = `
		<div class="stlp--settings">
			<div class="inline-drawer">
				<div class="inline-drawer-toggle inline-drawer-header">
					<b>Landing Page</b>
					<div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
				</div>
				<div class="inline-drawer-content" style="font-size:small;">
					Stuff...
				</div>
			</div>
		</div>
		`;
        $('#extensions_settings').append(html);
    };
    addSettings();
});
