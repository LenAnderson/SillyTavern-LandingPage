import { characters } from '../../../../../script.js';
import { extension_settings } from '../../../../extensions.js';
import { groups } from '../../../../group-chats.js';
import { executeSlashCommands } from '../../../../slash-commands.js';
import { log } from '../index.js';
import { Card } from './Card.js';

export class LandingPage {
    /**@type {Card[]}*/ cards = [];

    /**@type {Object}*/ settings;

    /**@type {HTMLElement}*/ dom;




    constructor() {
        this.settings = Object.assign({
            isEnabled: true,
            displayStyle: 'Bottom',
            cardHeight: 200,
            showFavorites: true,
            onlyFavorites: false,
            highlightFavorites: true,
            numCards: 5,
            numAvatars: 4,
            showExpression: true,
            extensions: ['png'],
            expression: 'joy',
            menuList: [],
            lastChat: { character:null, group:null },
            hideTopBar: true,
            bgList: [],
        }, extension_settings.landingPage ?? {});
        extension_settings.landingPage = this.settings;
        if (this.settings.hideTopBar) {
            document.body.classList.add('stlp--hideTopBar');
        }
    }


    async load() {
        log('LandingPage.load');
        const compCards = (a,b)=>{
            if (this.settings.showFavorites) {
                if (a.fav && !b.fav) return -1;
                if (!a.fav && b.fav) return 1;
            }
            return b.date_last_chat - a.date_last_chat;
        };
        const cards = await Promise.all(
            [...characters, ...groups]
                .filter(it=>!this.settings.onlyFavorites || it.fav)
                .toSorted(compCards)
                .slice(0, this.settings.numCards)
                .map(it=>new Card(it).load()),
        );
        this.cards = cards;
        log('LandingPage.load COMPLETED', this, cards);
    }




    async updateBackground() {
        let bg;
        for (const item of this.settings.bgList) {
            let val = (await executeSlashCommands(item.command))?.pipe;
            try { val = JSON.parse(val); } catch { /* empty */ }
            if (!!val) {
                bg = item;
                break;
            }
        }
        if (bg) {
            this.dom.style.backgroundImage = `url("${bg.url}")`;
        } else {
            this.dom.style.backgroundImage = '';
        }
    }




    async render() {
        this.dom?.remove();
        const container = document.createElement('div'); {
            this.dom = container;
            this.updateBackground();
            container.classList.add('stlp--container');
            container.style.setProperty('--stlp--cardHeight', `${this.settings.cardHeight}px`);
            const wrap = document.createElement('div'); {
                wrap.classList.add('stlp--wrapper');
                if (this.settings.highlightFavorites) {
                    wrap.classList.add('stlp--highlightFavorites');
                }
                wrap.setAttribute('data-displayStyle', this.settings.displayStyle);
                const root = document.createElement('div'); {
                    root.classList.add('stlp--cards');
                    const els = await Promise.all(this.cards.map(async(card)=>{
                        return await card.render(this.settings);
                    }));
                    els.forEach(it=>root.append(it));
                    wrap.append(root);
                }
                container.append(wrap);
            }
            const menu = document.createElement('ul'); {
                menu.classList.add('stlp--menu');
                this.settings.menuList.forEach(item=>{
                    const li = document.createElement('li'); {
                        li.classList.add('stlp--item');
                        li.setAttribute('data-stlp--label', item.label);
                        li.textContent = item.label;
                        li.addEventListener('click', async()=>{
                            await executeSlashCommands(item.command);
                        });
                        menu.append(li);
                    }
                });
                container.append(menu);
            }
        }
        return this.dom;
    }
    unrender() {
        this.dom?.remove();
        this.dom = null;
    }
}
