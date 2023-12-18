import { Generate, characters, chat, eventSource, event_types, getThumbnailUrl, messageFormatting, openCharacterChat, reloadCurrentChat, saveChatConditional, setCharacterId, substituteParams } from '../../../../script.js';
import { groups, openGroupById, openGroupChat, resetSelectedGroup } from '../../../group-chats.js';
import { delay } from '../../../utils.js';
import { ContextMenu } from './src/ContextMenu.js';
import { MenuItem } from './src/MenuItem.js';




const log = (...msg)=>console.log('[STL]', ...msg);

let dom;
const remDom = async()=>{
    dom?.remove();
    dom = null;
};
const makeDom = async()=>{
    remDom();
    dom = document.createElement('div'); {
        dom.classList.add('stl--chars');
        const chars = [...characters, ...groups].toSorted((a,b)=>b.date_last_chat - a.date_last_chat).slice(0, 5);
        chars.forEach(c=>{
            const char = document.createElement('div'); {
                char.classList.add('stl--char');
                char.addEventListener('click', async()=>{
                    if (c.members) {
                        openGroupById(c.id);
                    } else {
                        resetSelectedGroup();
                        setCharacterId(characters.findIndex(it=>it==c));
                        await delay(1);
                        await reloadCurrentChat();
                    }
                });
                const name = document.createElement('div'); {
                    name.classList.add('stl--name');
                    name.textContent = c.name;
                    char.append(name);
                }
                const ava = document.createElement('div'); {
                    ava.classList.add('stl--avatar');
                    if (c.members) {
                        ava.classList.add(`stl--${Math.min(4, c.members.length)}`);
                        char.classList.add(`stl--${Math.min(4, c.members.length)}`);
                        c.members.slice(0, 4).map(m=>characters.find(it=>it.avatar==m)).forEach((m, idx)=>{
                            const subAva = document.createElement('div'); {
                                subAva.classList.add('stl--sub');
                                subAva.classList.add(`stl--a${idx}`);
                                subAva.style.backgroundImage = `url("/characters/${m.avatar}")`;
                                ava.append(subAva);
                                const url = `/characters/${m.name}/neutral.png`;
                                fetch(url, {method:'HEAD'}).then(resp=>{
                                    if (resp.ok) {
                                        subAva.style.backgroundImage = `url("${url}")`;
                                    }
                                });
                            }
                        });
                    } else {
                        ava.style.backgroundImage = `url("/characters/${c.avatar}")`;
                        const url = `/characters/${c.name}/neutral.png`;
                        fetch(url, {method:'HEAD'}).then(resp=>{
                            if (resp.ok) {
                                ava.style.backgroundImage = `url("${url}")`;
                            }
                        });
                    }
                    char.append(ava);
                }
                dom.append(char);
            }
        });
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
		<div class="stmfc--settings">
			<div class="inline-drawer">
				<div class="inline-drawer-toggle inline-drawer-header">
					<b>Swipe Continue</b>
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
