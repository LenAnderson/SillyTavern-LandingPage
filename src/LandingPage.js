import { characters } from '../../../../../script.js';
import { extension_settings } from '../../../../extensions.js';
import { groups } from '../../../../group-chats.js';
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
            expression: 'joy',
        }, extension_settings.landingPage ?? {});
        extension_settings.landingPage = this.settings;
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




    async render() {
        this.dom?.remove();
        const wrap = document.createElement('div'); {
            this.dom = wrap;
            wrap.classList.add('stlp--wrapper');
            if (this.settings.highlightFavorites) {
                wrap.classList.add('stlp--highlightFavorites');
            }
            wrap.setAttribute('data-displayStyle', this.settings.displayStyle);
            wrap.style.setProperty('--stlp--cardHeight', `${this.settings.cardHeight}px`);
            const root = document.createElement('div'); {
                root.classList.add('stlp--cards');
                const els = await Promise.all(this.cards.map(async(card)=>{
                    return await card.render(this.settings);
                }));
                els.forEach(it=>root.append(it));
                wrap.append(root);
            }
        }
        return this.dom;
    }
    unrender() {
        this.dom?.remove();
        this.dom = null;
    }
}
