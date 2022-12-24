export function cls(...classes: (string | boolean)[]) {
  return classes.filter(Boolean).join(" ");
}
