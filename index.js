import { characters, eventSource, event_types, getRequestHeaders, messageFormatting, reloadCurrentChat, saveSettingsDebounced, selectCharacterById, setCharacterId, substituteParams, this_chid } from '../../../../script.js';
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
        if (extension_settings.landingPage.highlightFavorites) {
            dom.classList.add('stlp--highlightFavorites');
        }
        const root = document.createElement('div'); {
            root.classList.add('stlp--chars');
            const chars = [...characters, ...groups].toSorted(compCards).slice(0, extension_settings.landingPage.numCards);
            chars.forEach(c=>{
                let lmCon;
                let lastMes;
                const char = document.createElement('div'); {
                    char.classList.add('stlp--char');
                    if (c.fav) {
                        char.classList.add('stlp--fav');
                    }
                    char.addEventListener('pointerenter', ()=>{
                        lmCon?.classList?.add('stlp--active');
                    });
                    char.addEventListener('pointerleave', ()=>{
                        lmCon?.classList?.remove('stlp--active');
                    });
                    char.addEventListener('wheel', async(evt)=>{
                        lastMes.scrollTop += evt.deltaY;
                    });
                    char.addEventListener('click', async()=>{
                        if (c.members) {
                            openGroupById(c.id);
                        } else {
                            const cidx = characters.findIndex(it=>it==c);
                            selectCharacterById(String(cidx));
                        }
                    });
                    const name = document.createElement('div'); {
                        name.classList.add('stlp--name');
                        name.textContent = c.name;
                        char.append(name);
                    }
                    const ava = document.createElement('div'); {
                        ava.classList.add('stlp--avatar');
                        const members = c.members?.slice(0, extension_settings.landingPage?.numAvatars ?? 4) ?? [c.avatar];
                        char.classList.add('stlp--group');
                        char.style.flex = `0 0 calc(var(--stlp--cardWidth) * ${1 + 0.5 * (members.length - 1)})`;
                        char.style.width = `calc(var(--stlp--cardWidth) * ${1 + 0.5 * (members.length - 1)})`;
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
                            let members;
                            if (c.members) {
                                const chars = mesList.slice(1).filter(it=>!it.is_user && !it.is_system).map(it=>it.name).toReversed().slice(0,25);
                                members = [];
                                for (const c of chars) {
                                    if (!members.includes(c)) {
                                        members.push(c);
                                        if (members.length >= extension_settings.landingPage?.numAvatars ?? 4) {
                                            break;
                                        }
                                    }
                                }
                                while (members.length < (extension_settings.landingPage?.numAvatars ?? 4) && members.length < c.members.length) {
                                    const mems = c.members.filter(it=>!members.includes(it));
                                    members.push(mems[Math.floor(Math.random()*mems.length)]);
                                }
                            } else {
                                members = [c.avatar];
                            }
                            char.style.flex = `0 0 calc(var(--stlp--cardWidth) * ${1 + 0.5 * (members.length - 1)})`;
                            char.style.width = `calc(var(--stlp--cardWidth) * ${1 + 0.5 * (members.length - 1)})`;
                            const newAva = document.createElement('div'); {
                                newAva.classList.add('stlp--avatar');
                                const imgs = [];
                                members.map(m=>characters.find(it=>it.name == m || it.avatar == m)).forEach((m, idx)=>{
                                    const img = document.createElement('img'); {
                                        imgs.push(img);
                                        img.classList.add('stlp--sub');
                                        img.classList.add(`stlp--a${idx}`);
                                        img.addEventListener('load', ()=>{
                                            if (!img.closest('body')) return;
                                            img.style.width = `calc(var(--stlp--cardHeight) / ${img.naturalHeight} * ${img.naturalWidth})`;
                                            img.style.flex = `0 0 calc(var(--stlp--cardHeight) / ${img.naturalHeight} * ${img.naturalWidth})`;
                                            img.style.marginRight = `calc(var(--stlp--cardHeight) / ${img.naturalHeight} * ${img.naturalWidth} * -0.5)`;
                                            char.style.width = `${imgs.reduce((sum,cur)=>sum+cur.offsetWidth*(sum?0.5:1),0)}px`;
                                            char.style.flex = `0 0 ${imgs.reduce((sum,cur)=>sum+cur.offsetWidth*(sum?0.5:1),0)}px`;
                                        });
                                        newAva.append(img);
                                        const url = `/characters/${m.name}/${extension_settings.landingPage.expression ?? 'joy'}.png`;
                                        fetch(url, { method:'HEAD' }).then(async(resp)=>{
                                            if (resp.ok) {
                                                img.src = url;
                                            } else {
                                                img.src = `/characters/${m.avatar}`;
                                            }
                                        });
                                    }
                                });
                                ava.replaceWith(newAva);
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
            highlightFavorites: true,
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
                            <label class="checkbox_label">
                                <input type="checkbox" id="stlp--isEnabled" ${settings.isEnabled ? 'checked' : ''}>
                                Enable landing page
                            </label>
                        </div>
                        <div class="flex-container">
                            <label class="checkbox_label">
                                <input type="checkbox" id="stlp--showFavorites" ${settings.showFavorites ? 'checked' : ''}>
                                Always show favorites
                            </label>
                        </div>
                        <div class="flex-container">
                            <label class="checkbox_label">
                                <input type="checkbox" id="stlp--highlightFavorites" ${(settings.highlightFavorites ?? true) ? 'checked' : ''}>
                                Highlight favorites
                            </label>
                        </div>
                        <div class="flex-container">
                            <label>
                                Number of characters to show
                                <input type="number" class="text_pole" min="0" id="stlp--numCards" value="${settings.numCards}">
                            </label>
                        </div>
                        <div class="flex-container">
                            <label>
                                Number of avatars to show for group chats
                                <input type="number" class="text_pole" min="0" id="stlp--numAvatars" value="${settings.numAvatars}">
                            </label>
                        </div>
                        <div class="flex-container">
                            <label>
                                Expression to be used for characters with expression sprites
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
            onChatChanged(getContext().chatId);
        });
        document.querySelector('#stlp--showFavorites').addEventListener('click', ()=>{
            settings.showFavorites = document.querySelector('#stlp--showFavorites').checked;
            saveSettingsDebounced();
            onChatChanged(getContext().chatId);
        });
        document.querySelector('#stlp--highlightFavorites').addEventListener('click', ()=>{
            settings.highlightFavorites = document.querySelector('#stlp--highlightFavorites').checked;
            saveSettingsDebounced();
            onChatChanged(getContext().chatId);
        });
        document.querySelector('#stlp--numCards').addEventListener('change', ()=>{
            settings.numCards = Number(document.querySelector('#stlp--numCards').value);
            saveSettingsDebounced();
            onChatChanged(getContext().chatId);
        });
        document.querySelector('#stlp--numAvatars').addEventListener('click', ()=>{
            settings.numAvatars = Number(document.querySelector('#stlp--numAvatars').value);
            saveSettingsDebounced();
            onChatChanged(getContext().chatId);
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
            onChatChanged(getContext().chatId);
        })
    };
    addSettings();
});
