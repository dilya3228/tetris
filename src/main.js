// Импортируем функцию для предотвращающая перехода на другие страницы
// import { navigationGuard } from './utils/navigationGuard';

// Импортируем функцию для продолжения отправки откликов после обновления страницы
// import { resumeMultiSubmit } from './utils/resumeMultiSubmit';

// Импортируем функцию, которая добавляет кнопку "Отправить отклики"
import { addResponseBtn } from "./modules/interface/addResponseBtn";
import { processVacancies } from "./modules/process/processVacancies";
import { delay } from "./utils/delay";
import { toggleResponseBtn } from "./modules/interface/toggleResponseBtn";
import { setIsSubmitting } from "./globals/globals";
import '../src/modules/submit/telegramSending';
// Основная точка входа в приложение
(async function main() {
  // await addResponseBtn(); // визуально добавляем кнопку
  await delay(5000); // небольшая пауза

  // ⬇️ автозапуск, если ранее был включен флаг autoRepeat
  // if (localStorage.getItem("autoRepeat") === "true") {

    await toggleResponseBtn(); // он сам вызовет processVacancies внутри
    // setIsSubmitting(true);
    // localStorage.setItem("autoRepeat", "true");
  // } else {
  //   await processVacancies(); // если не автозапуск — выполняем вручную
  // }
})();
