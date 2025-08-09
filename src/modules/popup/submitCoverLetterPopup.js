// Импортируем константы
import { CONSTANTS } from '../../config/constants.js';

// Импортируем селекторы
import { SELECTORS } from '../../config/selectors.js';

// Импортируем функцию задержки выполнения кода
import {delay, getRandomDelay} from '../../utils/delay.js';

// Импортируем функцию для выбора резюме
import { selectResume } from './selectResume.js';

// Импортируем функцию для добавления готового письма в поле ввода
import { insertCoverLetter } from './insertCoverLetter.js';
import {addToSkippedUrls, goBackAndWait} from '../submit/helpers'

// Функция для отправки сопроводительного письма
export async function submitCoverLetterPopup(companyTitle) {
  const currentUrl = window.location.href;

  // 1. Если бот попал на форму с startedWithQuestion=false — надо выйти и запомнить вакансию

  if (currentUrl.includes("startedWithQuestion=false")) {
    const url = new URL(currentUrl);
    const id = url.searchParams.get("vacancyId");
    if (id) {
      const skip = new Set(JSON.parse(localStorage.getItem("hh_skip_vacancy_ids") || "[]"));
      skip.add(id);
      localStorage.setItem("hh_skip_vacancy_ids", JSON.stringify([...skip]));
      console.warn("🚫 Popup: добавил в skip:", id);
    }

    // await goBackAndWait({ timeout: 20000 });
    addToSkippedUrls(location.href); // сохраняем вакансию в список, чтобы потом вручную ссылки открыть

    await goBackAndWait();

    await delay(300);
    return;
  }
  const respondBtn = document.querySelector(SELECTORS.respondBtnPopup);
  if (!respondBtn) {
    console.warn("️ Кнопка 'Откликнуться' в попапе не найдена");
    return;
  }
  // Выбираем резюме
  await selectResume();

  // Ждём заданное время перед вставкой письма
  await delay(CONSTANTS.delayMs);

  // Вставляем сопроводительное письмо
  insertCoverLetter(CONSTANTS.coverLetter, companyTitle);

  const preClickDelay = getRandomDelay(3000, 5000);
  console.log(`⏳ Задержка перед кликом по кнопке: ${Math.floor(preClickDelay / 1000)} сек`);
  await delay(preClickDelay);
  // Нажимаем кнопку "Откликнуться"
  respondBtn.click();

  // Ждём, чтобы корректно завершить процесс
  await delay(CONSTANTS.delayMs);
}
