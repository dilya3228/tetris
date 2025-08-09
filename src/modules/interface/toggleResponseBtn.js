// Импортируем функции для проверки и установки состояния отправки откликов
import { getIsSubmitting, setIsSubmitting } from "../../globals/globals";

// Импортируем функцию для отправки откликов
import { processVacancies } from "../process/processVacancies";
import {addToSkippedUrls, goBackAndWait} from "../submit/helpers";

// // Жмём "назад" и ждём смены адреса (или таймаут)
// function goBackAndWait({ timeout = 15000 } = {}) {
//   return new Promise((resolve) => {
//     const start = location.href;
//     let done = false;
//
//     const finish = () => {
//       if (done) return;
//       done = true;
//       window.removeEventListener('popstate', onChange);
//       window.removeEventListener('hashchange', onChange);
//       resolve();
//     };
//     const onChange = () => {
//       if (location.href !== start) finish();
//     };
//
//     window.addEventListener('popstate', onChange);
//     window.addEventListener('hashchange', onChange);
//
//     // Фолбэк, если записи в истории нет или сайт не триггерит события
//     const timer = setTimeout(() => {
//       // если URL не сменился — пробуем вернуться на реферер
//       if (location.href === start) {
//         if (document.referrer) location.assign(document.referrer);
//       }
//       finish();
//     }, timeout);
//
//     // Сам переход назад
//     history.back();
//   });
// }
export async function toggleResponseBtn() {
  const currentUrl = window.location.href;

  // 1. Если бот попал на форму с startedWithQuestion=false — надо выйти и запомнить вакансию
  if (currentUrl.includes("startedWithQuestion")) {
    console.warn("📛 Попали на форму-опрос, выходим и запоминаем");

    // 2. Извлекаем vacancyId из URL
    const url = new URL(currentUrl);
    const badId = url.searchParams.get("vacancyId");
    console.log(badId, 'badId')
    // 3. Записываем его в skip-лист
    if (badId) {
      const skip = new Set(JSON.parse(localStorage.getItem("hh_skip_vacancy_ids") || "[]"));
      skip.add(badId);
      localStorage.setItem("hh_skip_vacancy_ids", JSON.stringify([...skip]));
      console.log("🚫 Вакансия добавлена в skip:", badId);
    }

    // 4. Назад
    // await goBackAndWait({ timeout: 20000 });
    addToSkippedUrls(location.href); // сохраняем вакансию в список, чтобы потом вручную ссылки открыть

    await goBackAndWait();
    return;
  }

  // === обычная логика ===
  const button = document.querySelector('[data-action="submit-responses"]');

  if (getIsSubmitting()) {
    setIsSubmitting(false);
    localStorage.removeItem("autoRepeat");
    button.textContent = "Отправить отклики";
    console.log("⏹️ Отправка откликов остановлена");
    return;
  }

  setIsSubmitting(true);
  localStorage.setItem("autoRepeat", "true");
  button.textContent = "Остановить отправку";
  console.log("▶️ Начата отправка откликов");

  try {
    await processVacancies();
  } catch (error) {
    console.error("Ошибка при отправке откликов:", error);
  } finally {
    console.log('finially')
    setIsSubmitting(false);
    button.textContent = "Отправить отклики";
    console.log("✅ Отправка откликов завершена");

    if (localStorage.getItem("autoRepeat") === "true") {
      console.log("⏳ Таймер: 1 час до перезагрузки страницы...");
      setTimeout(() => {
        console.log("🔁 Перезагружаем страницу — прошло 1 час");
        location.reload();
      }, 3600000);
    }
  }
}
