import { characters } from '../../../../../script.js';

export class Member {
    /**@type {Member[]}*/static list = [];


    static getByName(name) {
        let mem = this.list.find(it=>it.name == name);
        if (!mem) {
            const memData = characters.find(it=>it.name == name);
            if (memData) {
                mem = new Member(memData);
                this.list.push(mem);
            }
        }
        return mem;
    }

    static getByAvatar(avatar) {
        let mem = this.list.find(it=>it.avatar == avatar);
        if (!mem) {
            const memData = characters.find(it=>it.avatar == avatar);
            if (memData) {
                mem = new Member(memData);
                this.list.push(mem);
            }
        }
        return mem;
    }




    /**@type {String}*/ name;
    /**@type {String}*/ avatar;

    /**@type {HTMLImageElement}*/ avatarImg;
    /**@type {HTMLImageElement}*/ expressionImg;




    constructor(props) {
        this.name = props.name;
        this.avatar = props.avatar;
    }


    async loadAvatar() {
        return new Promise((resolve, reject)=>{
            const img = new Image();
            this.avatarImg = img;
            img.addEventListener('load', ()=>resolve(img));
            img.addEventListener('error', ()=>reject());
            img.src = `/characters/${this.avatar}`;
        });
    }
    async loadExpression(expr) {
        return new Promise(async(resolve, reject)=>{
            const img = new Image();
            this.expressionImg = img;
            img.addEventListener('load', ()=>resolve(img));
            img.addEventListener('error', ()=>reject());
            const url = `/characters/${this.name}/${expr}.png`;
            const response = await fetch(url, { method:'HEAD' });
            if (response.ok) {
                img.src = url;
            } else {
                img.src = `/characters/${this.avatar}`;
            }
        });
    }
}
