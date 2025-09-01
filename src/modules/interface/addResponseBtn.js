// Импортируем константы
import { CONSTANTS } from '../../config/constants.js';

// Импортируем селекторы
import { SELECTORS } from '../../config/selectors.js';

// Импортируем функцию задержки выполнения кода
import { delay } from '../../utils/delay.js';

// Импортируем функцию для переключения состояния кнопки
// import { toggleResponseBtn } from './toggleResponseBtn.js';

// Импортируем функцию для поиска элемента с указанным текстом
import { findElementByText } from './findElementByText.js';
import {getIsSubmitting, setIsSubmitting} from "../../globals/globals";
import {processVacancies} from "../process/processVacancies";

//  PS старая версия - Функция добавляет новую кнопку в навигации "Отправить отклики"
// export async function addResponseBtn() {
//   // Ждём заданное время перед продолжением
//   await delay(CONSTANTS.delayMs);
//
//   // Получаем список элементов навигации
//   const navItems = document.querySelectorAll(SELECTORS.naviItems);
//
//   // Клонируем 5-й элемент навигации
//   const clonedItem = navItems[4].cloneNode(true);
//
//   // Находим текстовый элемент внутри склонированного элемента
//   const textElement = findElementByText(clonedItem);
//
//   // Устанавливаем атрибут для назначения обработчика
//   textElement.setAttribute('data-action', 'submit-responses');
//
//   // Меняем текст кнопки
//   textElement.textContent = 'Отправить отклики';
//
//   // Вставляем склонированный элемент сразу после исходного
//   navItems[4].insertAdjacentElement('afterend', clonedItem);
//
//   // Ищем в клоне новую кнопку по атрибуту
//   const newButton = clonedItem.querySelector('[data-action="submit-responses"]');
// // поскольку у нас самовызывающаяся функция main, кнопка больше не нужна
//   // newButton.addEventListener('click', toggleResponseBtn);
// }

// === run-state ===
const RUN_FLAG = "hh_enabled";          // "1" | "0"
const RUN_LOCK = "__hh_running__";      // boolean в window
const ABORT_KEY = "__hh_abort__";       // AbortController в window

export function isEnabled() { return localStorage.getItem(RUN_FLAG) === "1"; }
function setEnabled(v) { localStorage.setItem(RUN_FLAG, v ? "1" : "0"); }

function isRunning() { return Boolean(window[RUN_LOCK]); }
function setRunning(v) { window[RUN_LOCK] = Boolean(v); }

function getAbortSignal() {
  return window[ABORT_KEY]?.signal;
}
function createAbort() {
  window[ABORT_KEY]?.abort?.();
  window[ABORT_KEY] = new AbortController();
  return window[ABORT_KEY].signal;
}
function abortRun() {
  window[ABORT_KEY]?.abort?.();
}

// Универсальная проверка «надо ли остановиться прямо сейчас»
export function shouldStop() {
  return !isEnabled() || getAbortSignal()?.aborted || !getIsSubmitting?.();
}


export async function startBot() {
  if (isRunning()) {
    console.log("⚠️ Уже запущено, игнорирую повторный старт");
    return;
  }
  setEnabled(true);
  setRunning(true);
  setIsSubmitting?.(true);
  const signal = createAbort();

  // updateResponseBtn(); // обновим текст кнопки
  console.log("▶️ Бот запущен");

  try {
    // основной проход
    await processVacancies();

    // если нужен повтор через час — можно оставить твой таймер здесь
    // но не перезапускай, если выключили
    if (!signal.aborted && isEnabled()) {
      console.log("⏳ Планирую перезагрузку через пол часа, ждем епта…");
      setTimeout(() => { if (isEnabled()) location.reload(); }, 1800000);
    }
  } catch (e) {
    console.error("Ошибка в раннере:", e);
  } finally {
    setRunning(false);
    setIsSubmitting?.(false);
    // updateResponseBtn();
    console.log("⏹️ Раннер завершён");
  }
}

function stopBot() {
  if (!isRunning() && !isEnabled()) {
    console.log("ℹ️ Бот уже остановлен");
    return;
  }
  setEnabled(false);
  abortRun();          // прерываем текущие ожидания/циклы
  setRunning(false);
  setIsSubmitting?.(false);
  // updateResponseBtn();
  console.log("⏹️ Бот остановлен пользователем");
}

export async function addResponseBtn() {
  // Если кнопка уже создана — не дублируем
  if (document.querySelector("#hh-response-fixed-btn")) return;

  const btn = document.createElement("button");
  btn.id = "hh-response-fixed-btn";
  btn.textContent = (isEnabled() || isRunning()) ? "Остановить отправку" : "Отправить отклики";

  // простейшие стили: фиксируем справа по центру
  Object.assign(btn.style, {
    position: "fixed",
    top: "50%",
    left: "50px",
    transform: "translateY(-50%)",
    zIndex: 9999,
    background: "#0059b3",
    color: "#fff",
    border: "none",
    padding: "25px",
    borderRadius: "8px",
    cursor: "pointer",
    boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
    fontSize: "14px",
  });

  btn.addEventListener("mouseenter", () => { btn.style.opacity = "0.9"; });
  btn.addEventListener("mouseleave", () => { btn.style.opacity = "1"; });


  btn.addEventListener("click", () => {
    if (isEnabled() || isRunning()) {
      console.log('вызов stopBot')
      btn.textContent ="Отправить отклики"

      stopBot();
    } else {
      console.log('вызов startBot')
      btn.textContent ="Остановить отклики"

      startBot();
    }
  });

  document.body.appendChild(btn);
}
// // обновление текста кнопки в любом месте
// function updateResponseBtn(btn = document.querySelector('[data-action="submit-responses"]')) {
//   if (!btn) return;
//   btn.textContent = (isEnabled() || isRunning()) ? "Остановить отправку" : "Отправить отклики";
// }