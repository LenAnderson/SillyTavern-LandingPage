import { characters, eventSource, event_types, getRequestHeaders, messageFormatting, reloadCurrentChat, saveSettingsDebounced, setCharacterId, substituteParams, this_chid } from '../../../../script.js';
import { extension_settings, getContext } from '../../../extensions.js';
import { groups, openGroupById, resetSelectedGroup } from '../../../group-chats.js';
import { delay } from '../../../utils.js';




const log = (...msg)=>console.log('[STL]', ...msg);

let dom;
const remDom = async()=>{
    dom?.remove();
    dom = null;
};
const compCards = (a,b)=>{
    if (a.fav && !b.fav) return -1;
    if (!a.fav && b.fav) return 1;
    return b.date_last_chat - a.date_last_chat;
};
const makeDom = async()=>{
    remDom();
    dom = document.createElement('div'); {
        dom.classList.add('stlp--wrapper');
        const root = document.createElement('div'); {
            root.classList.add('stlp--chars');
            const chars = [...characters, ...groups].toSorted(compCards).slice(0, extension_settings.landingPage.numCards);
            chars.forEach(c=>{
                let lmCon;
                let lastMes;
                const char = document.createElement('div'); {
                    char.classList.add('stlp--char');
                    char.addEventListener('pointerenter', ()=>{
                        lmCon?.classList?.add('stlp--active');
                    });
                    char.addEventListener('pointerleave', ()=>{
                        lmCon?.classList?.remove('stlp--active');
                    });
                    char.addEventListener('wheel', async(evt)=>{
                        log('WHEEL', evt);
                        lastMes.scrollTop += evt.deltaY;
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
                            const members = c.members.slice(0, extension_settings.landingPage?.numAvatars ?? 4);
                            char.classList.add('stlp--group');
                            char.style.flex = `0 0 calc(var(--stlp--cardWidth) * ${1 + 0.5 * (members.length - 1)})`;
                            char.style.width = `calc(var(--stlp--cardWidth) * ${1 + 0.5 * (members.length - 1)})`;
                            members.map(m=>characters.find(it=>it.avatar == m)).forEach((m, idx)=>{
                                const subAva = document.createElement('div'); {
                                    subAva.classList.add('stlp--sub');
                                    subAva.classList.add(`stlp--a${idx}`);
                                    subAva.style.backgroundImage = `url("/characters/${m.avatar}")`;
                                    ava.append(subAva);
                                    const url = `/characters/${m.name}/${extension_settings.landingPage.expression ?? 'joy'}.png`;
                                    fetch(url, { method:'HEAD' }).then(resp=>{
                                        if (resp.ok) {
                                            subAva.style.backgroundImage = `url("${url}")`;
                                        }
                                    });
                                }
                            });
                        } else {
                            ava.style.backgroundImage = `url("/characters/${c.avatar}")`;
                            const url = `/characters/${c.name}/${extension_settings.landingPage.expression ?? 'joy'}.png`;
                            fetch(url, { method:'HEAD' }).then(resp=>{
                                if (resp.ok) {
                                    ava.style.backgroundImage = `url("${url}")`;
                                }
                            });
                        }
                        char.append(ava);
                    }
                    fetch(`/api/chats${c.members ? '/group' : ''}/get`, {
                        method: 'POST',
                        headers: getRequestHeaders(),
                        body: JSON.stringify(
                            c.members ?
                                { id: c.chat_id } :
                                {
                                    ch_name: c.name,
                                    file_name: c.chat,
                                    avatar_url: c.avatar,
                                },
                        ),
                        cache: 'no-cache',
                    }).then(async(resp)=>{
                        if (resp.ok) {
                            const mesList = (await resp.json());
                            if (c.members) {
                                const chars = mesList.filter(it=>!it.is_user && !it.is_system).map(it=>it.name).toReversed();
                                const lastChars = [];
                                for (const c of chars) {
                                    if (!lastChars.includes(c)) {
                                        lastChars.push(c);
                                        if (lastChars.length >= extension_settings.landingPage?.numAvatars ?? 4) {
                                            break;
                                        }
                                    }
                                }
                                char.classList.add('stlp--group');
                                char.style.flex = `0 0 calc(var(--stlp--cardWidth) * ${1 + 0.5 * (lastChars.length - 1)})`;
                                char.style.width = `calc(var(--stlp--cardWidth) * ${1 + 0.5 * (lastChars.length - 1)})`;
                                const newAva = document.createElement('div'); {
                                    newAva.classList.add('stlp--avatar');
                                    lastChars.map(m=>characters.find(it=>it.name == m)).forEach((m, idx)=>{
                                        const subAva = document.createElement('div'); {
                                            subAva.classList.add('stlp--sub');
                                            subAva.classList.add(`stlp--a${idx}`);
                                            subAva.style.backgroundImage = `url("/characters/${m.avatar}")`;
                                            newAva.append(subAva);
                                            const url = `/characters/${m.name}/${extension_settings.landingPage.expression ?? 'joy'}.png`;
                                            fetch(url, { method:'HEAD' }).then(resp=>{
                                                if (resp.ok) {
                                                    subAva.style.backgroundImage = `url("${url}")`;
                                                }
                                            });
                                        }
                                    });
                                    ava.replaceWith(newAva);
                                }
                            }
                            const mes = mesList.slice(-1)[0];
                            if (mes) {
                                const con = document.createElement('div'); {
                                    lmCon = con;
                                    con.classList.add('stlp--lastMes');
                                    con.classList.add('mes');
                                    const lm = document.createElement('div'); {
                                        lastMes = lm;
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
    if (chatFile === undefined && extension_settings.landingPage?.isEnabled) {
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
    if (!extension_settings.landingPage) {
        extension_settings.landingPage = {
            isEnabled: true,
            showFavorites: true,
            numCards: 5,
            numAvatars: 4,
        };
    }
    const settings = extension_settings.landingPage;
    const addSettings = () => {
        const html = `
            <div class="stlp--settings">
                <div class="inline-drawer">
                    <div class="inline-drawer-toggle inline-drawer-header">
                        <b>Landing Page</b>
                        <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
                    </div>
                    <div class="inline-drawer-content" style="font-size:small;">
                        <div class="flex-container">
                            <label>
                                <small>Enable landing page</small><br>
                                <input type="checkbox" id="stlp--isEnabled" ${settings.isEnabled ? 'checked' : ''}>
                            </label>
                        </div>
                        <div class="flex-container">
                            <label>
                                <small>Always show favorites</small><br>
                                <input type="checkbox" id="stlp--showFavorites" ${settings.showFavorites ? 'checked' : ''}>
                            </label>
                        </div>
                        <div class="flex-container">
                            <label>
                                <small>Number of characters to show</small><br>
                                <input type="number" class="text_pole" min="0" id="stlp--numCards" value="${settings.numCards}">
                            </label>
                        </div>
                        <div class="flex-container">
                            <label>
                                <small>Number of avatars to show for group chats</small><br>
                                <input type="number" class="text_pole" min="0" id="stlp--numAvatars" value="${settings.numAvatars}">
                            </label>
                        </div>
                        <div class="flex-container">
                            <label>
                                <small>Expression to be used for characters with expression sprites</small><br>
                                <select class="text_pole" id="stlp--expression"></select>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
		`;
        $('#extensions_settings').append(html);
        document.querySelector('#stlp--isEnabled').addEventListener('click', ()=>{
            settings.isEnabled = document.querySelector('#stlp--isEnabled').checked;
            saveSettingsDebounced();
            onChatChanged(getContext().chat_id);
        });
        document.querySelector('#stlp--showFavorites').addEventListener('click', ()=>{
            settings.showFavorites = document.querySelector('#stlp--showFavorites').checked;
            saveSettingsDebounced();
            onChatChanged(getContext().chat_id);
        });
        document.querySelector('#stlp--numCards').addEventListener('change', ()=>{
            settings.numCards = Number(document.querySelector('#stlp--numCards').value);
            saveSettingsDebounced();
            onChatChanged(getContext().chat_id);
        });
        document.querySelector('#stlp--numAvatars').addEventListener('click', ()=>{
            settings.numAvatars = Number(document.querySelector('#stlp--numAvatars').value);
            saveSettingsDebounced();
            onChatChanged(getContext().chat_id);
        });
        const sel = document.querySelector('#stlp--expression');
        const exp = [
            'admiration',
            'amusement',
            'anger',
            'annoyance',
            'approval',
            'caring',
            'confusion',
            'curiosity',
            'desire',
            'disappointment',
            'disapproval',
            'disgust',
            'embarrassment',
            'excitement',
            'fear',
            'gratitude',
            'grief',
            'joy',
            'love',
            'nervousness',
            'neutral',
            'optimism',
            'pride',
            'realization',
            'relief',
            'remorse',
            'sadness',
            'surprise',
        ];
        exp.forEach(e=>{
            const opt = document.createElement('option'); {
                opt.value = e;
                opt.textContent = e;
                opt.selected = (settings.expression ?? 'joy') == e;
                sel.append(opt);
            }
        });
        sel.addEventListener('change', ()=>{
            settings.expression = sel.value;
            saveSettingsDebounced();
            onChatChanged(getContext().chat_id);
        })
    };
    addSettings();
});
