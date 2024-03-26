import { characters, getRequestHeaders, messageFormatting, selectCharacterById, setActiveCharacter, setActiveGroup, setCharacterId, substituteParams } from '../../../../../script.js';
import { openGroupById } from '../../../../group-chats.js';
import { applyTagsOnCharacterSelect } from '../../../../tags.js';
import { Member } from './Member.js';

export class Card {
    /**@type {String}*/ name;
    /**@type {Member[]}*/ members;
    /**@type {Boolean}*/ isGroup;
    /**@type {String}*/ avatar;
    /**@type {Number}*/ lastChatDate;
    /**@type {String}*/ lastChatId;
    /**@type {Boolean}*/ isFavorite;

    /**@type {Function}*/ openChat;
    /**@type {String}*/ chatEndpoint;
    /**@type {Object}*/ getChatBody;

    /**@type {Member[]}*/ lastMembers;
    /**@type {Object}*/ lastMessage;
    /**@type {HTMLImageElement}*/ avatarImg;

    /**@type {Boolean}*/ isLoaded = false;




    constructor(char) {
        if (char.members) {
            this.isGroup = true;
            this.avatar = char.avatar_url;
            this.members = char.members.map(m=>Member.getByAvatar(m));
            this.openChat = ()=>{
                openGroupById(char.id);
                setActiveCharacter(null);
                setActiveGroup(char.id);
            };
            this.chatEndpoint = '/api/chats/group';
            this.getChatBody = {
                id: char.chat_id,
            };
        } else {
            this.isGroup = false;
            this.avatar = char.avatar;
            this.members = [Member.getByAvatar(char.avatar)];
            this.openChat = ()=>{
                const id = String(characters.findIndex(it=>it == char));
                selectCharacterById(id);
                const tagWorkaround = document.createElement('div');
                tagWorkaround.setAttribute('chid', id);
                applyTagsOnCharacterSelect.call(tagWorkaround);
                setActiveCharacter(this.avatar);
                setActiveGroup(null);
            };
            this.chatEndpoint = '/api/chats';
            this.getChatBody = {
                ch_name: char.name,
                file_name: char.chat,
                avatar_url: char.avatar,
            };
        }
        this.name = char.name;
        this.lastChatDate = char.date_last_chat;
        this.lastChatId = char.chat;
        this.isFavorite = char.fav;
    }


    getCharByName(name) {
        return characters.find(it=>it.name == name);
    }
    getCharByAvatar(avatar) {
        return characters.find(it=>it.avatar == avatar);
    }


    async reload() {
        this.isLoaded = false;
        await this.load();
    }
    async load() {
        if (this.isLoaded) return;
        const response = await fetch(`${this.chatEndpoint}/get`, {
            method: 'POST',
            headers: getRequestHeaders(),
            body: JSON.stringify(this.getChatBody),
            cache: 'no-cache',
        });
        if (response.ok) {
            let mesList = await response.json() ?? [];
            if (!Array.isArray(mesList)) mesList = [];
            this.updateLastMembers(mesList);
            this.lastMessage = mesList.slice(-1)[0];
        }
        return this;
    }

    async loadAvatar() {
        return new Promise((resolve, reject)=>{
            const img = new Image();
            this.avatarImg = img;
            img.addEventListener('load', ()=>resolve(img));
            img.addEventListener('error', ()=>reject());
            img.src = this.isGroup ? this.avatar : `/characters/${this.avatar}`;
        });
    }

    updateLastMembers(mesList) {
        if (this.isGroup) {
            const chars = mesList
                .slice(1)
                .filter(it=>!it.is_user && !it.is_system)
                .map(it=>Member.getByName(it.name))
                .filter(it=>it)
                .toReversed()
                .slice(0,25)
            ;
            const members = [];
            for (const c of chars) {
                if (!members.includes(c)) {
                    members.push(c);
                }
            }
            while (members.length < this.members.length) {
                const mems = this.members.filter(it=>!members.includes(it));
                members.push(mems[Math.floor(Math.random() * mems.length)]);
            }
            this.lastMembers = members;
        } else {
            this.lastMembers = this.members.slice();
        }
    }

    getLastMembers(num) {
        return this.lastMembers.slice(0, num);
    }


    async render(settings) {
        const wrap = document.createElement('div'); {
            wrap.classList.add('stlp--cardWrap');
            const item = document.createElement('div'); {
                item.classList.add('stlp--card');
                if (this.isFavorite) {
                    item.classList.add('stlp--favorite');
                }
                item.addEventListener('click', ()=>this.openChat());
                item.addEventListener('wheel', async(evt)=>{
                    message.scrollTop += evt.deltaY;
                });
                const name = document.createElement('div'); {
                    name.classList.add('stlp--name');
                    name.textContent = this.name;
                    item.append(name);
                }
                const ava = document.createElement('div'); {
                    ava.classList.add('stlp--avatar');
                    if (settings.showExpression) {
                        await Promise.all(this.getLastMembers(settings.numAvatars).map(async(mem)=>{
                            const memImg = await mem.loadExpression(settings.expression);
                            const img = document.createElement('img'); {
                                img.classList.add('stlp--avatarImg');
                                img.style.width = `calc(var(--stlp--cardHeight) / ${memImg.naturalHeight} * ${memImg.naturalWidth})`;
                                img.style.flex = `0 0 calc(var(--stlp--cardHeight) / ${memImg.naturalHeight} * ${memImg.naturalWidth})`;
                                img.style.marginRight = `calc(var(--stlp--cardHeight) / ${memImg.naturalHeight} * ${memImg.naturalWidth} / -2)`;
                                img.src = memImg.src;
                            }
                            ava.append(img);
                        }));
                    } else {
                        const memImg = await this.loadAvatar();
                        const img = document.createElement('img'); {
                            img.classList.add('stlp--avatarImg');
                            img.style.width = `calc(var(--stlp--cardHeight) / ${memImg.naturalHeight} * ${memImg.naturalWidth})`;
                            img.style.flex = `0 0 calc(var(--stlp--cardHeight) / ${memImg.naturalHeight} * ${memImg.naturalWidth})`;
                            img.style.marginRight = `calc(var(--stlp--cardHeight) / ${memImg.naturalHeight} * ${memImg.naturalWidth} / -2)`;
                            img.src = memImg.src;
                        }
                        ava.append(img);
                    }
                    item.append(ava);
                }
                wrap.append(item);
            }
            const message = document.createElement('div'); {
                message.classList.add('stlp--mes');
                message.classList.add('mes_text');
                if (this.lastMessage) {
                    let messageText = substituteParams(this.lastMessage.mes ?? '');
                    // setCharacterId(-1);
                    messageText = messageFormatting(
                        messageText,
                        this.lastMessage.name,
                        false,
                        this.lastMessage.is_user,
                    );
                    // setCharacterId(undefined);
                    message.innerHTML = messageText;
                }
                wrap.append(message);
            }
        }
        return wrap;
    }
}
