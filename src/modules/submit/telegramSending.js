// ================== Telegram flush ==================
const TELEGRAM = {
    TOKEN: "7629045705:AAH_4-AqHkqF2QoX5ckieLG9YafbVMLXv-I",
    CHAT_ID: "1983417002",     // число или строка: @username не подходит
    ENABLED: true,
};

const TG_KEYS = {
    skipped: "hh_skipped_urls",
    lastFlushAt: "hh_tg_last_flush_at",
    lock: "hh_tg_lock", // защита от запуска в нескольких вкладках
};

const TG_INTERVAL_MS = 30 * 60_000;        // 30 минут
const TG_START_THRESHOLD_MS = 27 * 60_000; //

// ====== UTIL ======
function getSkippedUrls() {
    try { return JSON.parse(localStorage.getItem(TG_KEYS.skipped) || "[]"); }
    catch { return []; }
}
function setSkippedUrls(arr) {
    localStorage.setItem(TG_KEYS.skipped, JSON.stringify(arr || []));
}

async function tgSendMessage(text) {
    const url = `https://api.telegram.org/bot${TELEGRAM.TOKEN}/sendMessage`;
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: TELEGRAM.CHAT_ID, text, disable_web_page_preview: true }),
    });
    if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`Telegram API ${res.status}: ${t}`);
    }
}

function chunkByChars(lines, max = 3500) {
    const chunks = [];
    let buf = "";
    for (const line of lines) {
        const s = String(line);
        if ((buf + s).length + 1 > max) {
            if (buf) chunks.push(buf);
            buf = s;
        } else {
            buf = buf ? `${buf}\n${s}` : s;
        }
    }
    if (buf) chunks.push(buf);
    return chunks;
}

function tryAcquireLock(ttlMs = 90_000) {
    const now = Date.now();
    const raw = localStorage.getItem(TG_KEYS.lock);
    const ts = raw ? Number(raw) : 0;
    if (ts && now - ts < ttlMs) return false;
    localStorage.setItem(TG_KEYS.lock, String(now));
    return true;
}
function releaseLock() {
    localStorage.removeItem(TG_KEYS.lock);
}

// ====== PUBLIC API (вешаем в window для ручного теста) ======
window.tgFlushNow = async function tgFlushNow() {
    console.log("[TG] manual flush requested");
    await flushSkippedToTelegram();
};
window.tgAddDummy = function tgAddDummy() {
    const key = TG_KEYS.skipped;
    const arr = getSkippedUrls();
    const sample = `https://hh.ru/vacancy/${Math.floor(Math.random()*1e6)}?startedWithQuestion=false&vacancyId=${Math.floor(Math.random()*1e6)}`;
    arr.push(sample);
    localStorage.setItem(key, JSON.stringify(arr));
    console.log("[TG] dummy url added:", sample);
};

// ====== CORE ======
async function flushSkippedToTelegram() {
    try {
        console.log("[TG] flush start");
        if (!TELEGRAM.ENABLED) { console.log("[TG] disabled"); return; }
        if (!TELEGRAM.TOKEN || !TELEGRAM.CHAT_ID) { console.warn("[TG] missing TOKEN or CHAT_ID"); return; }

        if (!tryAcquireLock()) { console.log("[TG] lock busy, skipping"); return; }

        const urls = Array.from(new Set(getSkippedUrls()));
        if (!urls.length) {
            console.log("[TG] nothing to send");
            localStorage.setItem(TG_KEYS.lastFlushAt, String(Date.now()));
            return;
        }

        const header = `🧾 HH skipped URLs (${new Date().toLocaleString()}):`;
        const chunks = chunkByChars(urls, 3500);

        await tgSendMessage(header);
        for (const ch of chunks) {
            await tgSendMessage(ch);
            await new Promise(r => setTimeout(r, 300));
        }

        setSkippedUrls([]);
        localStorage.setItem(TG_KEYS.lastFlushAt, String(Date.now()));
        console.log(`[TG] sent ${urls.length} link(s) and cleared storage`);
    } catch (e) {
        console.error("[TG] flush error:", e);
        // полезно увидеть, не блокирует ли CSP/CORS
        if (e instanceof TypeError) {
            console.warn("[TG] TypeError обычно означает CORS/CSP/сеть. Проверь политику страницы.");
        }
    } finally {
        releaseLock();
    }
}

// ====== SCHEDULER (IIFE) ======
(function scheduleTelegramFlush() {
    try {
        console.log("TG init: loaded");
        // стартовая отправка, если прошло > TG_START_THRESHOLD_MS
        const last = Number(localStorage.getItem(TG_KEYS.lastFlushAt) || 0);
        if (Date.now() - last > TG_START_THRESHOLD_MS) {
            console.log("TG cold start flush");
            flushSkippedToTelegram();
        }

        console.log(`TG scheduling every ${TG_INTERVAL_MS}ms`);
        setInterval(() => {
            console.log("TG tick: flush scheduled");
            flushSkippedToTelegram();
        }, TG_INTERVAL_MS);
    } catch (e) {
        console.error("TG init error:", e);
    }
})();

// ====== (опционально) та же функция addToSkippedUrls, если хочешь держать тут ======
window.addToSkippedUrls = function addToSkippedUrls(url) {
    const key = TG_KEYS.skipped;

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
};
