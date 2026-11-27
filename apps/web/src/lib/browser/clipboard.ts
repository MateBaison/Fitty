/**
 * Copies the text of a field. Some browsers refuse the Clipboard API (blocked
 * permission, insecure origin, embedded browsers): the field is then selected
 * and copied the older way, and stays selected if that fails too.
 */
export async function copyField(field: HTMLInputElement): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(field.value);
    return true;
  } catch {
    field.focus();
    field.select();
    return document.execCommand("copy");
  }
}
