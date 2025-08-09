// Импортируем селекторы
import { SELECTORS } from '../../config/selectors.js';
import { CONSTANTS } from "../../config/constants.js";

// Импортируем функцию для отправки сопроводительного письма
import { submitCoverLetter } from '../popup/submitCoverLetter.js';
import {delay, getRandomDelay} from "../../utils/delay";
import {insertCoverLetter} from "../popup/insertCoverLetter";
import {confirmCountry, confirmEmployerAlert} from "../../utils/popupHelpers";

export async function submitSingleVacancy() {
  const card = document.querySelector(SELECTORS.vacancyCard);
  const skip = new Set(JSON.parse(localStorage.getItem("hh_skip_vacancy_ids") || "[]"));

  // Если карточка вакансии есть (то есть мы на списке) — обрабатываем как раньше
  if (card) {
    const linkEl = card.querySelector('a[href*="vacancy_response"]');
    const href = linkEl?.href;
    const url = href ? new URL(href, location.origin) : null;
    const vid = url?.searchParams.get("vacancyId");

    if (vid && skip.has(vid)) {
      console.warn("⏭️ Пропускаю вакансию из skip-листа:", vid);
      return;
    }

    card.click();
    await delay(300); // дождаться перехода
    // ✅ Подтверждение при попапе "другая страна"
    await confirmCountry();
    await confirmEmployerAlert();

    console.log('📨 submitCoverLetter вызывается после клика по карточке');
    await submitCoverLetter();
    return;
  }

  // 🛡️ Если карточки нет, но мы уже на форме — ищем поля и кнопку вручную
  const textarea = document.querySelector('#cover-letter textarea');
  const submitBtn = document.querySelector('form#cover-letter button[type="submit"]');

  if (textarea && submitBtn) {
    console.log("✏️ Обнаружено поле сопроводительного письма — вставляем текст");

    const titleEl = document.querySelector('[data-qa="vacancy-serp__vacancy-employer-text"]');
    const vacancyTitle = titleEl?.innerText || "компанию";

    insertCoverLetter(CONSTANTS.coverLetter, vacancyTitle);
    const preSubmitDelay = getRandomDelay(3000, 5000);
    console.log(`⏳ Задержка перед отправкой формы: ${Math.floor(preSubmitDelay / 1000)} сек`);
    await delay(preSubmitDelay);

    submitBtn.click();
    await delay(1000); // дать странице отреагировать
  } else {
    console.warn("❗ Не удалось найти поле письма или кнопку — отклик не отправлен");
  }
}
