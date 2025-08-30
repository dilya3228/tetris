// Импортируем функцию для проверки, идет ли процесс отправки откликов
import { getIsSubmitting } from "../../globals/globals.js";

// Импортируем константы
import { CONSTANTS } from "../../config/constants.js";

// Импортируем селекторы
import { SELECTORS } from "../../config/selectors.js";

// Импортируем функцию задержки выполнения кода
import { delay, getRandomDelay } from "../../utils/delay.js";

// Импортируем функцию для проверки пропуска текущей вакансии
// import { skipVacancy } from '../../utils/addToBlacklist.js';

// Импортируем вспомогательные функции для обработки попапов
import {
  confirmCountry, // Подтверждает отклик на вакансию в другой стране
  confirmEmployerAlert, // Подтверждает отклик на вакансию "Непрямой работодатель"
  checkPopupActive, // Проверяет, открыт ли попап формы отклика
} from "../../utils/popupHelpers.js";

// Импортируем функцию для отправки сопроводительного письма через поап
import { submitCoverLetterPopup } from "../popup/submitCoverLetterPopup.js";

// Импортируем функцию для отправки сопроводительного письма напрямую
import { submitCoverLetter } from "../popup/submitCoverLetter.js";
import {addToSkippedUrls, goBackAndWait, pageHasText} from './helpers.js'
import {handleAlreadyViewedAndExit} from "../../utils/alreadyViewedAndExit";

export async function submitMultiVacancies() {

  const isFormPage = location.href.includes("startedWithQuestion=false") || pageHasText("Для отклика необходимо ответить");

  const skip = new Set(JSON.parse(localStorage.getItem("hh_skip_vacancy_ids") || "[]"));

  // Проверка на форме-опроснике ли мы
  if (isFormPage) {
    const url = new URL(location.href);
    const id = url.searchParams.get("vacancyId");
    if (id) {

      skip.add(id);
      localStorage.setItem("hh_skip_vacancy_ids", JSON.stringify([...skip]));
      console.warn("🚫 Добавил в skip по startedWithQuestion:", id);
    }
    // await goBackAndWait({ timeout: 20000 });
    addToSkippedUrls(location.href); // сохраняем вакансию в список, чтобы потом вручную ссылки открыть
    await goBackAndWait();

    await delay(300);

    return;
  }

  const vacancies = document.querySelectorAll(SELECTORS.vacancyCards);
  if (!vacancies.length) return;


  for (const vacancy of vacancies) {
    if (!getIsSubmitting()) {
      console.warn("источник бага - getIsSubmitting() вернул false — прерываю цикл преждевременно");
      return;
    }

    vacancy.scrollIntoView({ behavior: "smooth", block: "center" });
    vacancy.style.boxShadow = "0 0 8px #0059b3";

    const respondBtn = vacancy.querySelector(SELECTORS.respondBtn);
    if (!respondBtn) {
      console.warn("⛔ Кнопка отклика не найдена, пропускаю");
      vacancy.style.boxShadow = "0 0 4px red";
      continue;
    }

    // 🛡️ Защита: кнопка не 'Откликнуться'
    if (!["Respond", "Откликнуться"].includes(respondBtn.innerText)) {
      console.log(" Кнопка неактивна или неподходящая, пропускаю");
      continue;
    }

    const href = respondBtn?.getAttribute("href") || respondBtn?.dataset?.href;
    const vacancyId = (() => {
      try {
        const u = new URL(href, location.origin);
        return u.searchParams.get("vacancyId");
      } catch {
        return null;
      }
    })();

    // Пропуск по skip-листу
    if (vacancyId && skip.has(vacancyId)) {
      console.warn("⏭️ Пропускаю вакансию (в skip):", vacancyId);
      vacancy.style.boxShadow = "0 0 4px orange";
      continue;
    }

    await delay(500);

    const companyTitle = vacancy.querySelector(SELECTORS.companyTitle)?.innerText;

    if (["Respond", "Откликнуться"].includes(respondBtn?.innerText)) {
      const preClickDelay = getRandomDelay(3000, 5000);
      console.log(`⏳ Задержка перед кликом по кнопке: ${Math.floor(preClickDelay / 1000)} сек`);
      await delay(preClickDelay);

      respondBtn.click();

      await delay(800);

      if (await handleAlreadyViewedAndExit()) return;

      const delayMs = getRandomDelay(5000, 10000);
      console.log(`⏳ Задержка перед следующим откликом: ${Math.floor(delayMs / 1000)} сек`);
      await delay(delayMs);

      await confirmCountry();
      await confirmEmployerAlert();

      if (checkPopupActive()) {
        await submitCoverLetterPopup(companyTitle);
      } else {
        await submitCoverLetter(companyTitle);
      }
    }

    vacancy.style.boxShadow = "";
  }
}
