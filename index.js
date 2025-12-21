import { characters, eventSource, event_types, getRequestHeaders, saveSettingsDebounced, selectCharacterById } from '../../../../script.js';
import { extension_settings, getContext } from '../../../extensions.js';
import { groups, openGroupById } from '../../../group-chats.js';
import { registerSlashCommand } from '../../../slash-commands.js';
import { SlashCommand } from '../../../slash-commands/SlashCommand.js';
import { SlashCommandParser } from '../../../slash-commands/SlashCommandParser.js';
import { delay, getSortableDelay, isTrueBoolean } from '../../../utils.js';
import { LandingPage } from './src/LandingPage.js';
import { waitForFrame } from './src/wait.js';
import { getAllKnownTags, getTagIdByName, getTagNameById, getUsedTagIds, parseTagListInput } from './src/tagFilter.js';



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

export function debounceAsync(func, timeout = 300) {
    let timer;
    /**@type {Promise}*/
    let debouncePromise;
    /**@type {Function}*/
    let debounceResolver;
    return (...args) => {
        clearTimeout(timer);
        if (!debouncePromise) {
            debouncePromise = new Promise(resolve => {
                debounceResolver = resolve;
            });
        }
        timer = setTimeout(() => {
            debounceResolver(func.apply(this, args));
            debouncePromise = null;
        }, timeout);
        return debouncePromise;
    };
}


/**@type {LandingPage} */
let lp;
export let appReady = false;
let blockChatChanged = false;
const onChatChanged = async(chatFile)=>{
    if (blockChatChanged) return;
    if (chatFile === undefined && extension_settings.landingPage?.isEnabled) {
        log('LANDING');
        document.querySelector('#sheld').style.opacity = '0';
        document.querySelector('#sheld').style.pointerEvents = 'none';
        document.body.append(lp.render());
        lp.updateBackground();
        if (appReady) {
            await lp.load();
            lp.renderContent();
        }
    } else {
        if (extension_settings.landingPage?.isEnabled) {
            lp.settings.lastChat.character = characters[getContext().characterId]?.avatar;
            lp.settings.lastChat.group = getContext().groupId;
            saveSettingsDebounced();
        }
        lp.unrender();
        document.querySelector('#sheld').style.opacity = '';
        document.querySelector('#sheld').style.pointerEvents = '';
    }
};
const makeMenuItem = (item) => {
    const li = document.createElement('li'); {
        li.classList.add('stlp--item');
        const lw = document.createElement('div'); {
            lw.classList.add('stlp--labelWrap');
            const inp = document.createElement('input'); {
                inp.classList.add('stlp--label');
                inp.classList.add('text_pole');
                inp.value = item.label;
                inp.placeholder = 'Label';
                inp.addEventListener('input', ()=>{
                    item.label = inp.value.trim();
                    saveSettingsDebounced();
                    onChatChanged(getContext().chatId);
                });
                lw.append(inp);
            }
            li.append(lw);
        }
        const cw = document.createElement('div'); {
            cw.classList.add('stlp--commandWrap');
            const inp = document.createElement('textarea'); {
                inp.classList.add('stlp--command');
                inp.classList.add('text_pole');
                inp.value = item.command;
                inp.placeholder = 'STScript';
                inp.rows = 2;
                inp.addEventListener('input', ()=>{
                    item.command = inp.value.trim();
                    saveSettingsDebounced();
                    onChatChanged(getContext().chatId);
                });
                cw.append(inp);
            }
            li.append(cw);
        }
        const acts = document.createElement('div'); {
            acts.classList.add('.stlp--actions');
            const del = document.createElement('div'); {
                del.classList.add('stlp--remove');
                del.classList.add('menu_button');
                del.classList.add('menu_button_icon');
                del.classList.add('fa-solid');
                del.classList.add('fa-trash');
                del.classList.add('redWarningBG');
                del.addEventListener('click', ()=>{
                    li.remove();
                    lp.settings.menuList.splice(lp.settings.menuList.indexOf(item), 1);
                    saveSettingsDebounced();
                    onChatChanged(getContext().chatId);
                });
                acts.append(del);
            }
            li.append(acts);
        }
    }
    return li;
};
const makeBgItem = (item) => {
    const li = document.createElement('li'); {
        li.classList.add('stlp--item');
        const drag = document.createElement('div'); {
            drag.classList.add('stlp--dragHandle');
            drag.classList.add('drag-handle');
            drag.classList.add('ui-sortable-handler');
            drag.textContent = '☰';
            li.append(drag);
        }
        const cont = document.createElement('div'); {
            cont.classList.add('stlp--content');
            const lw = document.createElement('div'); {
                lw.classList.add('stlp--labelWrap');
                const inp = document.createElement('input'); {
                    inp.classList.add('stlp--label');
                    inp.classList.add('text_pole');
                    inp.value = item.url;
                    inp.placeholder = 'URL: /backgrounds/MyBackground.png';
                    inp.addEventListener('input', ()=>{
                        item.url = inp.value.trim();
                        saveSettingsDebounced();
                        lp.updateBackgroundDebounced();
                    });
                    lw.append(inp);
                }
                cont.append(lw);
            }
            const cw = document.createElement('div'); {
                cw.classList.add('stlp--commandWrap');
                const inp = document.createElement('textarea'); {
                    inp.classList.add('stlp--command');
                    inp.classList.add('text_pole');
                    inp.value = item.command;
                    inp.placeholder = 'STScript that returns true or false (or 1 or 0)';
                    inp.rows = 2;
                    inp.addEventListener('input', ()=>{
                        item.command = inp.value.trim();
                        saveSettingsDebounced();
                        lp.updateBackgroundDebounced();
                    });
                    cw.append(inp);
                }
                cont.append(cw);
            }
            li.append(cont);
        }
        const acts = document.createElement('div'); {
            acts.classList.add('.stlp--actions');
            const del = document.createElement('div'); {
                del.classList.add('stlp--remove');
                del.classList.add('menu_button');
                del.classList.add('menu_button_icon');
                del.classList.add('fa-solid');
                del.classList.add('fa-trash');
                del.classList.add('redWarningBG');
                del.addEventListener('click', ()=>{
                    li.remove();
                    lp.settings.bgList.splice(lp.settings.bgList.indexOf(item), 1);
                    saveSettingsDebounced();
                    onChatChanged(getContext().chatId);
                });
                acts.append(del);
            }
            li.append(acts);
        }
    }
    return li;
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
                    <label class="checkbox_label">
                        <input type="checkbox" id="stlp--hideTopBar" ${lp.settings.hideTopBar ? 'checked' : ''}>
                        Hide top bar
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
                        Tag filters
                        <div class="stlp--settingHelp">Click: include. Click again: exclude. Click again: clear.</div>
                        <div class="stlp--tagFilterActions">
                            <input type="text" class="text_pole" id="stlp--tagFilterSearch" placeholder="Search tags...">
                            <button type="button" class="stlp--tagFilterClear">Clear filters</button>
                        </div>
                        <div class="stlp--tagFilterControls">
                            <div class="stlp--tagFilterList" id="stlp--tagFilterList"></div>
                        </div>
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
                <div class="flex-container">
                    <div class="stlp--menuContainer">
                        Menu
                        <ul class="stlp--menuList"></ul>
                        <div class="stlp--menuActions">
                            <div class="stlp--menuAdd menu_button menu_button_icon fa-solid fa-plus"></div>
                        </div>
                    </div>
                </div>
                <div class="flex-container">
                    <div class="stlp--bgContainer">
                        Backgrounds <small>(first background with STScript returning <code>true</code> is used)</small>
                        <ul class="stlp--bgList"></ul>
                        <div class="stlp--bgActions">
                            <div class="stlp--bgAdd menu_button menu_button_icon fa-solid fa-plus"></div>
                        </div>
                    </div>
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
    document.querySelector('#stlp--hideTopBar').addEventListener('click', ()=>{
        lp.settings.hideTopBar = document.querySelector('#stlp--hideTopBar').checked;
        saveSettingsDebounced();
        document.body.classList[lp.settings.hideTopBar ? 'add' : 'remove']('stlp--hideTopBar');
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
    const refreshLandingDebounced = debounceAsync((chatId)=>onChatChanged(chatId), 400);

    // --- Tag filters (self-contained UI, no dependency on ST's tag CSS/renderers) ---
    /** @type {{ syncUi: ()=>void, clearSearch: ()=>void } | null} */
    let tagFilterUi = null;

    const ensureTagFilterArrays = () => {
        lp.settings.includeTagIds ??= [];
        lp.settings.excludeTagIds ??= [];
        lp.settings.includeTags ??= [];
        lp.settings.excludeTags ??= [];
    };

    const migrateTagNamesToIdsIfNeeded = () => {
        ensureTagFilterArrays();

        const hasIds = (lp.settings.includeTagIds?.length || lp.settings.excludeTagIds?.length);
        if (hasIds) {
            // Keep display-name arrays in sync for readability/back-compat.
            lp.settings.includeTags = (lp.settings.includeTagIds ?? []).map(getTagNameById).filter(Boolean);
            lp.settings.excludeTags = (lp.settings.excludeTagIds ?? []).map(getTagNameById).filter(Boolean);
            return;
        }

        const inc = (lp.settings.includeTags ?? []).map(getTagIdByName).filter(Boolean);
        const exc = (lp.settings.excludeTags ?? []).map(getTagIdByName).filter(Boolean);
        lp.settings.includeTagIds = Array.from(new Set(inc));
        lp.settings.excludeTagIds = Array.from(new Set(exc)).filter(id => !lp.settings.includeTagIds.includes(id));
        lp.settings.includeTags = lp.settings.includeTagIds.map(getTagNameById).filter(Boolean);
        lp.settings.excludeTags = lp.settings.excludeTagIds.map(getTagNameById).filter(Boolean);
    };

    const buildTagFilterUi = () => {
        migrateTagNamesToIdsIfNeeded();

        const searchEl = /** @type {HTMLInputElement} */ (document.querySelector('#stlp--tagFilterSearch'));
        const clearEl = /** @type {HTMLButtonElement} */ (document.querySelector('.stlp--tagFilterClear'));
        const listEl = /** @type {HTMLElement} */ (document.querySelector('#stlp--tagFilterList'));

        const usedTagIds = getUsedTagIds();
        const tags = getAllKnownTags()
            .filter(t => t?.id != null && typeof t?.name === 'string')
            .toSorted((a, b) => String(a.name).localeCompare(String(b.name)));

        const setState = (btn, state) => {
            btn.dataset.state = state;
            btn.classList.toggle('is-include', state === 'include');
            btn.classList.toggle('is-exclude', state === 'exclude');
            btn.classList.toggle('is-none', state === 'none');
        };

        const syncSettingsFromUi = () => {
            const include = Array.from(listEl.querySelectorAll('.stlp--tagPill.is-include')).map(el => el.dataset.tagId).filter(Boolean);
            const exclude = Array.from(listEl.querySelectorAll('.stlp--tagPill.is-exclude')).map(el => el.dataset.tagId).filter(Boolean);
            lp.settings.includeTagIds = include;
            lp.settings.excludeTagIds = exclude;
            lp.settings.includeTags = include.map(getTagNameById).filter(Boolean);
            lp.settings.excludeTags = exclude.map(getTagNameById).filter(Boolean);
            saveSettingsDebounced();
            refreshLandingDebounced(getContext().chatId);
        };

        const syncUiFromSettings = () => {
            ensureTagFilterArrays();
            const includeSet = new Set((lp.settings.includeTagIds ?? []).map(String));
            const excludeSet = new Set((lp.settings.excludeTagIds ?? []).map(String));
            Array.from(listEl.querySelectorAll('.stlp--tagPill')).forEach(btn => {
                const id = String(btn.dataset.tagId);
                if (includeSet.has(id)) setState(btn, 'include');
                else if (excludeSet.has(id)) setState(btn, 'exclude');
                else setState(btn, 'none');
            });
        };

        const onToggle = (evt) => {
            evt.preventDefault();
            const btn = /** @type {HTMLElement} */ (evt.currentTarget);
            const id = String(btn.dataset.tagId);
            ensureTagFilterArrays();

            const includeSet = new Set((lp.settings.includeTagIds ?? []).map(String));
            const excludeSet = new Set((lp.settings.excludeTagIds ?? []).map(String));

            // Cycle: none -> include -> exclude -> none
            if (!includeSet.has(id) && !excludeSet.has(id)) {
                includeSet.add(id);
            } else if (includeSet.has(id)) {
                includeSet.delete(id);
                excludeSet.add(id);
            } else {
                excludeSet.delete(id);
            }

            // Keep mutually exclusive
            for (const x of includeSet) excludeSet.delete(x);

            lp.settings.includeTagIds = Array.from(includeSet);
            lp.settings.excludeTagIds = Array.from(excludeSet);
            lp.settings.includeTags = lp.settings.includeTagIds.map(getTagNameById).filter(Boolean);
            lp.settings.excludeTags = lp.settings.excludeTagIds.map(getTagNameById).filter(Boolean);

            syncUiFromSettings();
            saveSettingsDebounced();
            refreshLandingDebounced(getContext().chatId);
        };

        const render = () => {
            listEl.innerHTML = '';
            const q = (searchEl.value ?? '').trim().toLowerCase();
            for (const tag of tags) {
                const id = String(tag.id);
                const name = String(tag.name);
                if (q && !name.toLowerCase().includes(q)) continue;

                const btn = document.createElement('button');
                btn.type = 'button';
                btn.classList.add('stlp--tagPill', 'is-none');
                btn.dataset.tagId = id;
                btn.title = name;
                btn.textContent = name;

                if (!usedTagIds.has(id)) {
                    btn.classList.add('is-unused');
                }

                // Preserve user-set tag colors (still self-contained; we just read data).
                if (tag.color) btn.style.setProperty('--stlp--tagBg', tag.color);
                if (tag.color2) btn.style.setProperty('--stlp--tagFg', tag.color2);

                btn.addEventListener('click', onToggle);
                listEl.append(btn);
            }

            syncUiFromSettings();
        };

        searchEl.addEventListener('input', render);
        clearEl?.addEventListener('click', () => {
            ensureTagFilterArrays();
            lp.settings.includeTagIds = [];
            lp.settings.excludeTagIds = [];
            lp.settings.includeTags = [];
            lp.settings.excludeTags = [];
            saveSettingsDebounced();
            refreshLandingDebounced(getContext().chatId);
            render();
        });
        render();

        tagFilterUi = {
            syncUi: syncUiFromSettings,
            clearSearch: () => { searchEl.value = ''; render(); },
        };
    };

    buildTagFilterUi();
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
    /**@type {HTMLElement} */
    const menuAdd = document.querySelector('.stlp--menuAdd');
    menuAdd.addEventListener('click', ()=>{
        const item = { label:'', command:'' };
        lp.settings.menuList.push(item);
        menuList.append(makeMenuItem(item));
    });
    const menuList = document.querySelector('.stlp--menuList'); {
        lp.settings.menuList.forEach(item=>{
            const li = makeMenuItem(item);
            menuList.append(li);
        });
    }
    /**@type {HTMLElement} */
    const bgAdd = document.querySelector('.stlp--bgAdd');
    bgAdd.addEventListener('click', ()=>{
        const item = { url:'', command:'' };
        lp.settings.bgList.push(item);
        const li = makeBgItem(item);
        li.item = item;
        bgList.append(li);
    });
    const bgList = document.querySelector('.stlp--bgList'); {
        lp.settings.bgList.forEach(item=>{
            const li = makeBgItem(item);
            li.item = item;
            bgList.append(li);
        });
    }
    // @ts-ignore
    $(bgList).sortable({
        delay: getSortableDelay(),
        stop: ()=>{
            lp.settings.bgList.sort((a,b)=>Array.from(bgList.children).findIndex(it=>it.item==a)-Array.from(bgList.children).findIndex(it=>it.item==b));
            saveSettingsDebounced();
            lp.updateBackgroundDebounced();
        },
    });
};
const init = () => {
    if (!lp) {
        lp = new LandingPage();
    }
    initSettings();
    onChatChanged();
};
init();
eventSource.once(event_types.APP_READY, async()=>{
    if (getContext().characterId === undefined && extension_settings.landingPage?.isEnabled) {
        await lp.load();
        lp.renderContent();
    }
    appReady = true;
});
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
registerSlashCommand('lp', (_, value)=>lpCallback(value), [], '<span class="monospace">(off|bottom|center|wall|infowall)</span> – change the landing page layout or disable it', true, true);

const continueLastChat = async()=>{
    if (lp.settings.lastChat.character) {
        const c = characters.findIndex(it=>it.avatar == lp.settings.lastChat.character);
        if (c > -1) {
            return await selectCharacterById(c);
        }
    } else if (lp.settings.lastChat.group) {
        const g = groups.find(it=>it.id == lp.settings.lastChat.group);
        if (g) {
            return await openGroupById(g.id);
        }
    }
    toastr.warning('no last chat');
    lp.fadeIn();
    lp.dom.querySelector('.stlp--menu')?.classList.remove('stlp--exit');
};
registerSlashCommand('lp-continue', ()=>continueLastChat(), [], ' – open the last active chat.', true, true);

const lpSetKey = {
    setCheckbox: (key, value)=>{
        document.querySelector(`#stlp--${key}`).checked = isTrueBoolean(value);
        document.querySelector(`#stlp--${key}`).dispatchEvent(new Event('click'));
    },
    setInput: (key, value)=>{
        document.querySelector(`#stlp--${key}`).value = value;
        document.querySelector(`#stlp--${key}`).dispatchEvent(new Event('change'));
        document.querySelector(`#stlp--${key}`).dispatchEvent(new Event('input'));
    },
    isEnabled: (value)=>lpSetKey.setCheckbox('isEnabled', value),
    hideTopBar: (value)=>lpSetKey.setCheckbox('hideTopBar', value),
    displayStyle: (value)=>lpSetKey.setInput('displayStyle', value),
    cardHeight: (value)=>lpSetKey.setInput('cardHeight', value),
    showFavorites: (value)=>lpSetKey.setCheckbox('showFavorites', value),
    onlyFavorites: (value)=>lpSetKey.setCheckbox('onlyFavorites', value),
    highlightFavorites: (value)=>lpSetKey.setCheckbox('highlightFavorites', value),
    numCards: (value)=>lpSetKey.setInput('numCards', value),
    numAvatars: (value)=>lpSetKey.setInput('numAvatars', value),
    showExpression: (value)=>lpSetKey.setCheckbox('showExpression', value),
    extensions: (value)=>lpSetKey.setInput('extensions', value),
    expression: (value)=>lpSetKey.setInput('expression', value),
    includeTags: (value)=>{
        lp.settings.includeTags = parseTagListInput(value);
        lp.settings.includeTagIds = lp.settings.includeTags.map(getTagIdByName).filter(Boolean);
        lp.settings.excludeTagIds = (lp.settings.excludeTagIds ?? []).filter(id => !lp.settings.includeTagIds.includes(String(id)));
        lp.settings.excludeTags = (lp.settings.excludeTagIds ?? []).map(getTagNameById).filter(Boolean);
        saveSettingsDebounced();
        onChatChanged(getContext().chatId);
        tagFilterUi?.clearSearch?.();
        tagFilterUi?.syncUi?.();
    },
    excludeTags: (value)=>{
        lp.settings.excludeTags = parseTagListInput(value);
        lp.settings.excludeTagIds = lp.settings.excludeTags.map(getTagIdByName).filter(Boolean);
        lp.settings.includeTagIds = (lp.settings.includeTagIds ?? []).filter(id => !lp.settings.excludeTagIds.includes(String(id)));
        lp.settings.includeTags = (lp.settings.includeTagIds ?? []).map(getTagNameById).filter(Boolean);
        saveSettingsDebounced();
        onChatChanged(getContext().chatId);
        tagFilterUi?.clearSearch?.();
        tagFilterUi?.syncUi?.();
    },
};
const lpSetCallback = (args, value)=>{
    const [_, key, val] = /^(\S+)(?:\s+(.+))?$/.exec(value);
    if (val !== undefined) {
        lpSetKey[key]?.(val);
    }
    return JSON.stringify(lp.settings[key]);
};
registerSlashCommand('lp-set',
    (args, value)=>lpSetCallback(args, value),
    [],
    `(${Object.keys(lpSetKey).join('|')}) (new value) – change LandingPage settings.`,
    true,
    true,
);

SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'lp-closechat',
    callback: async(args, value)=>{
        if (extension_settings.landingPage?.isEnabled) {
            await lp.fadeOut();
            await onChatChanged();
            await lp.fadeIn();
            blockChatChanged = true;
            eventSource.once(event_types.CHAT_CHANGED, ()=>{
                blockChatChanged = false;
            });
        }
        document.getElementById('option_close_chat')?.click();
        return '';
    },
    helpString: 'Closes the current chat with fade in/out to Landing Page.',
}));

SlashCommandParser.addCommandObject(SlashCommand.fromProps({ name: 'lp-exit',
    callback: async(args, value)=>{
        lp.dom.querySelector('.stlp--menu')?.classList.add('stlp--exit');
        const menuAnim = 510 + 100 * lp.dom.querySelectorAll('.stlp--menu > .stlp--item').length;
        await delay(menuAnim * 0.75);
        await lp.fadeOut();
        return '';
    },
    helpString: 'Fades out the Landing Page.',
}));
