// === helpers для skip-листа ===

import {HH_LISTING_URL} from "../../config/constants";

const SKIP_KEY = "hh_skip_vacancy_ids";

function loadSkipSet() {
    try {
        return new Set(JSON.parse(localStorage.getItem(SKIP_KEY) || "[]"));
    } catch { return new Set(); }
}
function saveSkipSet(set) {
    localStorage.setItem(SKIP_KEY, JSON.stringify([...set]));
}

/** Достаём vacancyId из href (абсолютного или относительного) */
function getVacancyIdFromHref(href) {
    try {
        const u = new URL(href, location.origin);
        return u.searchParams.get("vacancyId");
    } catch { return null; }
}

/** Ищем href кнопки "Откликнуться" внутри карточки */
function getResponseHrefFromCard(cardEl) {
    // если сама карточка — <a>, берем её href; иначе ищем вложенную ссылку/кнопку
    if (cardEl?.getAttribute?.("href")) return cardEl.getAttribute("href");
    const a = cardEl?.querySelector?.('a[href*="/applicant/vacancy_response"]');
    return a?.getAttribute("href") || null;
}

function waitForDomReady(timeout = 10000) {
    return new Promise((resolve, reject) => {
        if (document.readyState === "complete" || document.readyState === "interactive") {
            return resolve();
        }

        const timer = setTimeout(() => reject(new Error("⏱ DOM загрузка не завершена за timeout")), timeout);

        window.addEventListener("DOMContentLoaded", () => {
            clearTimeout(timer);
            resolve();
        });
    });
}



export async function goBackToListingSafely() {
    console.warn("🔙 Переход на фиксированную ссылку поиска");

    window.location.href = HH_LISTING_URL;

    await waitForDomReady();
}

export function addToSkippedUrls(url) {
    const key = "hh_skipped_urls";
    try {
        const stored = JSON.parse(localStorage.getItem(key) || "[]");
        if (!stored.includes(url)) {
            stored.push(url);
            localStorage.setItem(key, JSON.stringify(stored));
            console.log("📝 Добавлена в hh_skipped_urls:", url);
        } else {
            console.log("ℹ️ Ссылка уже есть в hh_skipped_urls");
        }
    } catch (e) {
        console.error("Ошибка при добавлении в hh_skipped_urls", e);
    }
}


// === навигация назад с ожиданием ===
export async function goBackAndWait() {
    console.warn("🔙 Переход на фиксированную ссылку поиска");
    // ставим простой лок, чтобы на новой странице не стартовало два раза
    sessionStorage.setItem("hh_nav_lock", "1");

    // чтобы не плодить историю (и не попасть назад на форму)
    location.replace(HH_LISTING_URL);

    // гарантированно останавливаем текущий поток
    await new Promise(() => {}); // никогда не резолвится
}
// === детекция "попали на форму" в текущем URL/DOM ===
export function pageHasText(text) {
    return document.body?.innerText.includes(text);
}
