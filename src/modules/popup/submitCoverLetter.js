// Импортируем константы
import { CONSTANTS } from '../../config/constants.js';

// Импортируем селекторы
import { SELECTORS } from '../../config/selectors.js';

// Импортируем функцию задержки выполнения кода
import { delay } from '../../utils/delay.js';

// Импортируем функцию для добавления готового письма в поле ввода
import { insertCoverLetter } from './insertCoverLetter.js';

// Импортируем функцию для закрытия чата
import { checkChatikActive } from '../../utils/popupHelpers.js';
import {addToSkippedUrls, goBackAndWait} from '../submit/helpers'
import {handleAlreadyViewedAndExit} from "../../utils/alreadyViewedAndExit";
// Функция для отправки сопроводительного письма
export async function submitCoverLetter(companyTitle) {
  const currentUrl = window.location.href;

  if (await handleAlreadyViewedAndExit()) return;

  if (currentUrl.includes("startedWithQuestion")) {
    const url = new URL(currentUrl);
    const id = url.searchParams.get("vacancyId");
    if (id) {
      const skip = new Set(JSON.parse(localStorage.getItem("hh_skip_vacancy_ids") || "[]"));
      skip.add(id);
      localStorage.setItem("hh_skip_vacancy_ids", JSON.stringify([...skip]));
      console.warn("🚫 Full: добавил в skip:", id);
    }

    // await goBackAndWait({ timeout: 20000 });
    addToSkippedUrls(location.href); // сохраняем вакансию в список, чтобы потом вручную ссылки открыть

    await goBackAndWait();

    await delay(300);
    return;
  }

  // Находим кнопку "Приложить письмо"
  const addCoverLetter = document.querySelector(SELECTORS.addCoverLetter);

  if (!addCoverLetter) {
    console.warn("⚠️ Кнопка 'Приложить письмо' не найдена");
    return;
  }

  // Нажимаем на кнопку "Приложить письмо"
  addCoverLetter.click();

  // Ждём заданное время перед вставкой письма
  await delay(CONSTANTS.delayMs);

  // Находим кнопку "Отправить"
  const sendBtn = document.querySelector(SELECTORS.sendBtn);

  // Вставляем сопроводительное письмо
  insertCoverLetter(CONSTANTS.coverLetter, companyTitle);

  // Нажимаем кнопку "Отправить"
  sendBtn.click();

  // Ждём, чтобы корректно завершить процесс
  await delay(CONSTANTS.delayMs);

  // Закрываем чат, если открылся
  checkChatikActive();
}
