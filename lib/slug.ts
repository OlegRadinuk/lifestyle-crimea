const RU_MAP: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i',
  й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't',
  у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '',
  э: 'e', ю: 'yu', я: 'ya',
};

/**
 * Адрес апартамента из его названия: «LS-ART-FLOWER KISS» → `flower-kiss`.
 *
 * Служебный префикс линейки (LS-, LS-ART-, LS-LUX-) в адресе не нужен — гость
 * его не читает и не ищет. Осторожно с «LS-BLACK STRONG» и «LS-DEEP MUSIC»:
 * BLACK и DEEP здесь часть названия, а не префикс, поэтому срезаем только
 * ART и LUX.
 */
export function slugifyApartment(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/^ls[\s-]+(art|lux)[\s-]+/i, '')
    .replace(/^ls[\s-]+/i, '')
    .replace(/[а-яё]/g, (c) => RU_MAP[c] ?? c)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Похоже ли значение на UUID — по такому адресу нужен редирект на slug. */
export function looksLikeUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
