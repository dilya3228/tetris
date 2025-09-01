// Импортируем функцию для предотвращающая перехода на другие страницы
// import { navigationGuard } from './utils/navigationGuard';

// Импортируем функцию для продолжения отправки откликов после обновления страницы
// import { resumeMultiSubmit } from './utils/resumeMultiSubmit';

// Импортируем функцию, которая добавляет кнопку "Отправить отклики"
import {addResponseBtn, isEnabled, startBot} from "./modules/interface/addResponseBtn";
import { processVacancies } from "./modules/process/processVacancies";
import { delay } from "./utils/delay";
// import { toggleResponseBtn } from "./modules/interface/toggleResponseBtn";
import { setIsSubmitting } from "./globals/globals";
import '../src/modules/submit/telegramSending';
// Основная точка входа в приложение

(async function main() {
  await addResponseBtn();
  await delay(500); // небольшая пауза для DOM

  // анти-дубль после replace()
  if (sessionStorage.getItem("hh_nav_lock") === "1") {
    sessionStorage.removeItem("hh_nav_lock");
  }

  // автозапуск, если ранее был включён
  if (isEnabled()) {
    console.log("🔁 Автовозобновление бота по флагу");
    await startBot();
  } else {
    console.log("⏸️ Бот выключен, ждём нажатия кнопки");
  }
})();