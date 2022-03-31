import refractor from "refractor/core";

const refractorLangs = {
  bash: () => import("refractor/lang/bash"),
  css: () => import("refractor/lang/css"),
  clike: () => import("refractor/lang/clike"),
  csharp: () => import("refractor/lang/csharp"),
  go: () => import("refractor/lang/go"),
  java: () => import("refractor/lang/java"),
  javascript: () => import("refractor/lang/javascript"),
  json: () => import("refractor/lang/json"),
  markup: () => import("refractor/lang/markup"),
  objectivec: () => import("refractor/lang/objectivec"),
  perl: () => import("refractor/lang/perl"),
  php: () => import("refractor/lang/php"),
  python: () => import("refractor/lang/python"),
  powershell: () => import("refractor/lang/powershell"),
  ruby: () => import("refractor/lang/ruby"),
  rust: () => import("refractor/lang/rust"),
  sql: () => import("refractor/lang/sql"),
  typescript: () => import("refractor/lang/typescript"),
  yaml: () => import("refractor/lang/yaml"),
};

const loadedLangs = new Map<string, Promise<unknown>>();

export const loadSyntaxHighlight = (
  language: string
): Promise<unknown> | null => {
  if (loadedLangs.has(language)) {
    // FIXME: won't return null
    return loadedLangs.get(language) ?? null;
  }

  const lang = refractorLangs[language];
  if (lang !== undefined) {
    const promise = lang().then((l) => {
      refractor.register(l.default);
      delete refractorLangs[language];
      loadedLangs.delete(language);
    });
    loadedLangs.set(language, promise);
    delete refractorLangs[language];
    return promise;
  }

  return null;
};
