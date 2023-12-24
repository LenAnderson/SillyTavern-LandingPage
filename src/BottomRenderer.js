import { Card } from './Card.js';

export class BottomRenderer {
    render(/**@type {Card[]}*/cards) {
        const root = document.createElement('div'); {
            root.classList.add('stlp--chars');
            cards.forEach(card=>{
                root.append(card.render());
            });
        }
    }
}
