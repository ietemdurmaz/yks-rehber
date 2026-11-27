export type FormState = { error?: string; message?: string };

const numberFormat = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 });
const moneyFormat = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  maximumFractionDigits: 0,
});
const dateFormat = new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" });
const dateTimeFormat = new Intl.DateTimeFormat("tr-TR", { dateStyle: "short", timeStyle: "medium" });

export const formatNumber = (n: number): string => numberFormat.format(n);
export const formatMoney = (n: number): string => moneyFormat.format(n);
export const formatDate = (iso: string): string => dateFormat.format(new Date(iso));
export const formatDateTime = (iso: string): string => dateTimeFormat.format(new Date(iso));
export const formatRange = (min: number, max: number): string =>
  min === max ? formatMoney(min) : `${formatMoney(min)} – ${formatMoney(max)}`;

export const institutionLabel: Record<"devlet" | "vakif", string> = {
  devlet: "Devlet",
  vakif: "Vakıf",
};
export const scoreTypeLabel: Record<"SAY" | "EA" | "SOZ" | "DIL" | "TYT", string> = {
  SAY: "Sayısal",
  EA: "Eşit Ağırlık",
  SOZ: "Sözel",
  DIL: "Dil",
  TYT: "TYT",
};
