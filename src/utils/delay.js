// Функция реализует задержку в выполнении кода на заданное количество миллисекунд
export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
export function getRandomDelay(min = 1000, max = 5000) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
