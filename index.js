import { eventSource, event_types, getRequestHeaders, saveSettingsDebounced } from '../../../../script.js';
import { extension_settings, getContext } from '../../../extensions.js';
import { registerSlashCommand } from '../../../slash-commands.js';
import { LandingPage } from './src/LandingPage.js';



// debugger;
export const log = (...msg)=>console.log('[STL]', ...msg);

export const findExpression = async (name) => {
    for (const ext of lp.settings.extensions) {
        const url = `/characters/${name}/${lp.settings.expression}.${ext}`;
        const resp = await fetch(url, {
            method: 'HEAD',
            headers: getRequestHeaders(),
        });
        if (resp.ok) {
            return url;
        }
    }
};


/**@type {LandingPage} */
let lp;
const onChatChanged = async(chatFile)=>{
    if (chatFile === undefined && extension_settings.landingPage?.isEnabled) {
        log('LANDING');
        document.querySelector('#sheld').style.display = 'none';
        await lp.load();
        document.body.append(await lp.render());
    } else {
        lp.unrender();
        document.querySelector('#sheld').style.display = '';
    }
};
const initSettings = () => {
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
                        <input type="checkbox" id="stlp--isEnabled" ${lp.settings.isEnabled ? 'checked' : ''}>
                        Enable landing page
                    </label>
                </div>
                <div class="flex-container">
                    <label>
                        Display style
                        <select class="text_pole" id="stlp--displayStyle" value="${lp.settings.displayStyle}"></select>
                    </label>
                </div>
                <div class="flex-container">
                    <label>
                        Card height
                        <input type="number" class="text_pole" min="0" id="stlp--cardHeight" value="${lp.settings.cardHeight ?? 200}">
                    </label>
                </div>
                <div class="flex-container">
                    <label class="checkbox_label">
                        <input type="checkbox" id="stlp--showFavorites" ${lp.settings.showFavorites ? 'checked' : ''}>
                        Always show favorites
                    </label>
                </div>
                <div class="flex-container">
                    <label class="checkbox_label">
                        <input type="checkbox" id="stlp--onlyFavorites" ${lp.settings.onlyFavorites ? 'checked' : ''}>
                        Only show favorites
                    </label>
                </div>
                <div class="flex-container">
                    <label class="checkbox_label">
                        <input type="checkbox" id="stlp--highlightFavorites" ${(lp.settings.highlightFavorites ?? true) ? 'checked' : ''}>
                        Highlight favorites
                    </label>
                </div>
                <div class="flex-container">
                    <label>
                        Number of characters to show
                        <input type="number" class="text_pole" min="0" id="stlp--numCards" value="${lp.settings.numCards}">
                    </label>
                </div>
                <div class="flex-container">
                    <label>
                        Number of avatars to show for group chats
                        <input type="number" class="text_pole" min="0" id="stlp--numAvatars" value="${lp.settings.numAvatars}">
                    </label>
                </div>
                <div class="flex-container">
                    <label class="checkbox_label">
                        <input type="checkbox" id="stlp--showExpression" ${(lp.settings.showExpression ?? true) ? 'checked' : ''}>
                        Show expression (uses avatar if disabled)
                    </label>
                </div>
                <div class="flex-container">
                    <label>
                        File extensions (comma-separated list, e.g. <code>png,gif,webp</code>)
                        <input type="text" class="text_pole" id="stlp--extensions" value="${lp.settings.extensions.join(',')}">
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
        lp.settings.isEnabled = document.querySelector('#stlp--isEnabled').checked;
        saveSettingsDebounced();
        onChatChanged(getContext().chatId);
    });
    const style = document.querySelector('#stlp--displayStyle');
    ['Bottom', 'Center', 'Wall', 'InfoWall'].forEach(it=>{
        const opt = document.createElement('option'); {
            opt.value = it;
            opt.textContent = it;
            opt.selected = lp.settings.displayStyle == it;
            style.append(opt);
        }
    });
    document.querySelector('#stlp--displayStyle').addEventListener('change', ()=>{
        lp.settings.displayStyle = document.querySelector('#stlp--displayStyle').value;
        saveSettingsDebounced();
        onChatChanged(getContext().chatId);
    });
    document.querySelector('#stlp--cardHeight').addEventListener('change', ()=>{
        lp.settings.cardHeight = Number(document.querySelector('#stlp--cardHeight').value);
        saveSettingsDebounced();
        onChatChanged(getContext().chatId);
    });
    document.querySelector('#stlp--showFavorites').addEventListener('click', ()=>{
        lp.settings.showFavorites = document.querySelector('#stlp--showFavorites').checked;
        saveSettingsDebounced();
        onChatChanged(getContext().chatId);
    });
    document.querySelector('#stlp--onlyFavorites').addEventListener('click', ()=>{
        lp.settings.onlyFavorites = document.querySelector('#stlp--onlyFavorites').checked;
        saveSettingsDebounced();
        onChatChanged(getContext().chatId);
    });
    document.querySelector('#stlp--highlightFavorites').addEventListener('click', ()=>{
        lp.settings.highlightFavorites = document.querySelector('#stlp--highlightFavorites').checked;
        saveSettingsDebounced();
        onChatChanged(getContext().chatId);
    });
    document.querySelector('#stlp--numCards').addEventListener('change', ()=>{
        lp.settings.numCards = Number(document.querySelector('#stlp--numCards').value);
        saveSettingsDebounced();
        onChatChanged(getContext().chatId);
    });
    document.querySelector('#stlp--numAvatars').addEventListener('change', ()=>{
        lp.settings.numAvatars = Number(document.querySelector('#stlp--numAvatars').value);
        saveSettingsDebounced();
        onChatChanged(getContext().chatId);
    });
    document.querySelector('#stlp--showExpression').addEventListener('click', ()=>{
        lp.settings.showExpression = document.querySelector('#stlp--showExpression').checked;
        saveSettingsDebounced();
        onChatChanged(getContext().chatId);
    });
    document.querySelector('#stlp--extensions').addEventListener('input', ()=>{
        lp.settings.extensions = document.querySelector('#stlp--extensions').value?.split(/,\s*/);
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
            opt.selected = (lp.settings.expression ?? 'joy') == e;
            sel.append(opt);
        }
    });
    sel.addEventListener('change', ()=>{
        lp.settings.expression = sel.value;
        saveSettingsDebounced();
        onChatChanged(getContext().chatId);
    });
};
const init = () => {
    if (!lp) {
        lp = new LandingPage();
    }
    initSettings();
    onChatChanged();
};
eventSource.on(event_types.APP_READY, init);
eventSource.on(event_types.CHAT_CHANGED, onChatChanged);







const lpCallback = (value) => {
    switch (value) {
        case 'off': {
            document.querySelector('#stlp--isEnabled').checked = false;
            lp.settings.isEnabled = false;
            break;
        }
        case 'center': {
            document.querySelector('#stlp--isEnabled').checked = true;
            lp.settings.isEnabled = true;
            document.querySelector('#stlp--displayStyle').value = 'Center';
            lp.settings.displayStyle = 'Center';
            break;
        }
        case 'wall': {
            document.querySelector('#stlp--isEnabled').checked = true;
            lp.settings.isEnabled = true;
            document.querySelector('#stlp--displayStyle').value = 'Wall';
            lp.settings.displayStyle = 'Wall';
            break;
        }
        case 'infowall': {
            document.querySelector('#stlp--isEnabled').checked = true;
            lp.settings.isEnabled = true;
            document.querySelector('#stlp--displayStyle').value = 'InfoWall';
            lp.settings.displayStyle = 'InfoWall';
            break;
        }
        default: {
            document.querySelector('#stlp--isEnabled').checked = true;
            lp.settings.isEnabled = true;
            document.querySelector('#stlp--displayStyle').value = 'Bottom';
            lp.settings.displayStyle = 'Bottom';
            break;
        }
    }
    saveSettingsDebounced();
    onChatChanged(getContext().chatId);
};
registerSlashCommand('lp', (_, value)=>lpCallback(value), [], '<span class="monospace">(off|bottom|center|wall|infowall)</span> change the landing page layout or disable it', true, true);
