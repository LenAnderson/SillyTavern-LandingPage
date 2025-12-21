import * as Tags from '../../../../tags.js';

/**
 * @param {string} s
 */
function normalizeTag(s) {
    return String(s ?? '')
        .trim()
        .replace(/^#/, '')
        .toLowerCase();
}

/**
 * Normalize for name matching (case + accents).
 * @param {string} s
 */
function normalizeTagMatchKey(s) {
    return normalizeTag(s)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Parse user input into a de-duplicated list of tag names.
 * Accepts comma/newline-separated values.
 *
 * @param {string} text
 * @returns {string[]}
 */
export function parseTagListInput(text) {
    const parts = String(text ?? '')
        .split(/[,;\n]/g)
        .map(t => t.trim())
        .filter(Boolean);

    /** @type {Map<string,string>} */
    const byNorm = new Map();
    for (const p of parts) {
        const norm = normalizeTag(p);
        if (!norm) continue;
        if (!byNorm.has(norm)) byNorm.set(norm, p.replace(/^#/, '').trim());
    }
    return Array.from(byNorm.values());
}

/**
 * Get all known tags from SillyTavern.
 * @returns {any[]}
 */
export function getAllKnownTags() {
    const list = /** @type {any[]} */ (Tags).tags ?? [];
    return Array.isArray(list) ? list : [];
}

/**
 * Get all known tag names from SillyTavern.
 * @returns {string[]}
 */
export function getAllKnownTagNames() {
    return getAllKnownTags()
        .map(t => t?.name)
        .filter(n => typeof n === 'string' && n.trim())
        .map(n => n.trim());
}

/**
 * @param {string} id
 * @returns {string|null}
 */
export function getTagNameById(id) {
    const tags = getAllKnownTags();
    const found = tags.find(t => String(t?.id) === String(id));
    const name = found?.name;
    return (typeof name === 'string' && name.trim()) ? name.trim() : null;
}

/**
 * @param {string} name
 * @returns {string|null}
 */
export function getTagIdByName(name) {
    const key = normalizeTagMatchKey(name);
    if (!key) return null;
    const tags = getAllKnownTags();
    const found = tags.find(t => normalizeTagMatchKey(t?.name ?? '') === key);
    const id = found?.id;
    return (id !== undefined && id !== null) ? String(id) : null;
}

/**
 * @returns {Set<string>}
 */
export function getUsedTagIds() {
    const map = /** @type {any} */ (Tags).tag_map ?? {};
    const out = new Set();
    if (!map || typeof map !== 'object') return out;
    for (const ids of Object.values(map)) {
        if (!Array.isArray(ids)) continue;
        for (const id of ids) {
            if (id === undefined || id === null) continue;
            out.add(String(id));
        }
    }
    return out;
}

/**
 * Canonical tag lookup for a SillyTavern entity:
 * - Characters are keyed by `character.avatar`
 * - Groups are keyed by `group.id`
 * (see SillyTavern `public/scripts/tags.js`)
 *
 * @param {any} entity Character or group object as used by ST (from `characters` or `groups`)
 * @returns {string[]} normalized tag names (lowercased)
 */
export function getEntityTagNamesNormalized(entity) {
    const getKey = /** @type {any} */ (Tags).getTagKeyForEntity;
    const getList = /** @type {any} */ (Tags).getTagsList;

    if (typeof getKey === 'function' && typeof getList === 'function') {
        const key = getKey(entity);
        const tagObjs = getList(key, false) ?? [];
        const names = Array.isArray(tagObjs) ? tagObjs.map(t => t?.name).filter(n => typeof n === 'string') : [];
        return Array.from(new Set(names.map(normalizeTag).filter(Boolean)));
    }

    // Fallback: some builds might include tags directly on the object.
    const direct = entity?.tags;
    if (Array.isArray(direct)) {
        return Array.from(new Set(direct.map(normalizeTag).filter(Boolean)));
    }
    return [];
}

/**
 * @param {any} entity
 * @returns {string[]} tag ids assigned to the entity (stringified)
 */
export function getEntityTagIds(entity) {
    const getKey = /** @type {any} */ (Tags).getTagKeyForEntity;
    const getList = /** @type {any} */ (Tags).getTagsList;

    if (typeof getKey === 'function' && typeof getList === 'function') {
        const key = getKey(entity);
        const tagObjs = getList(key, false) ?? [];
        const ids = Array.isArray(tagObjs) ? tagObjs.map(t => t?.id).filter(id => id !== undefined && id !== null) : [];
        return Array.from(new Set(ids.map(id => String(id))));
    }

    // Fallback: if entity has tags as names, we can only map to ids via name lookup.
    const direct = entity?.tags;
    if (Array.isArray(direct)) {
        const ids = direct.map(getTagIdByName).filter(Boolean).map(String);
        return Array.from(new Set(ids));
    }

    return [];
}

/**
 * @param {any} entity
 * @param {{includeTags?: string[], excludeTags?: string[], includeTagIds?: string[], excludeTagIds?: string[]}} settings
 * @param {{characters?: any[]}} deps
 * @returns {boolean}
 */
export function entityPassesTagFilters(entity, settings, deps = {}) {
    const includeIds = (settings?.includeTagIds ?? []).map(String).filter(Boolean);
    const excludeIds = (settings?.excludeTagIds ?? []).map(String).filter(Boolean);
    const includeNames = (settings?.includeTags ?? []).map(normalizeTag).filter(Boolean);
    const excludeNames = (settings?.excludeTags ?? []).map(normalizeTag).filter(Boolean);

    const hasIdFilters = includeIds.length > 0 || excludeIds.length > 0;
    const hasNameFilters = includeNames.length > 0 || excludeNames.length > 0;
    if (!hasIdFilters && !hasNameFilters) return true;

    // Prefer ID-based filtering (stable even if a tag is renamed).
    if (hasIdFilters) {
        const entityIds = getEntityTagIds(entity);
        if (includeIds.length && !includeIds.every(id => entityIds.includes(id))) return false;
        if (excludeIds.length && excludeIds.some(id => entityIds.includes(id))) return false;
        return true;
    }

    // Fallback: name-based filtering.
    const entityTags = getEntityTagNamesNormalized(entity);
    if (includeNames.length && !includeNames.every(t => entityTags.includes(t))) return false;
    if (excludeNames.length && excludeNames.some(t => entityTags.includes(t))) return false;
    return true;
}


