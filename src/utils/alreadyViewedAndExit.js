// текст может меняться, оставим мягкую проверку
import {goBackAndWait} from "../modules/submit/helpers";
import {SELECTORS} from "../config/selectors";
import {delay} from "./delay";

const VIEWED_TEXT_RX = /Отклик уже просмотрен работодателем/i;


export async function handleAlreadyViewedAndExit() {
    await delay(300)

    // const hasImmediateCheckingVacancyByBot = document.querySelectorAll(SELECTORS.alertAboutReadText);
    const hasText =
        VIEWED_TEXT_RX.test(document.body?.innerText || "")
        // || hasImmediateCheckingVacancyByBot

    if (!hasText) return false;

    console.log('замечен бот автоответчик через handleAlreadyViewedAndExit')

    // уходим на список и останавливаем текущий поток
    await goBackAndWait();
    // NB: эта функция не резолвится
    return true;
}
