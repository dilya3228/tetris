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

// Функция для отправки сопроводительного письма
export async function submitCoverLetter(vacancyTitle) {
  // Находим кнопку "Приложить письмо"
  const addCoverLetter = document.querySelector(SELECTORS.addCoverLetter);

  // Нажимаем на кнопку "Приложить письмо"
  addCoverLetter.click();

  // Ждём заданное время перед вставкой письма
  await delay(CONSTANTS.delayMs);

  // Находим кнопку "Отправить"
  const sendBtn = document.querySelector(SELECTORS.sendBtn);

  // Вставляем сопроводительное письмо
  insertCoverLetter(CONSTANTS.coverLetter, vacancyTitle);

  // Нажимаем кнопку "Отправить"
  sendBtn.click();

  // Ждём, чтобы корректно завершить процесс
  await delay(CONSTANTS.delayMs);

  // Закрываем чат, если открылся
  checkChatikActive();
}
