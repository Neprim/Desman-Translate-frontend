export const lang_list = ["ru", "en"]

let translations = {}
for (let lang of lang_list) {
    translations[lang] = require(`./translations/${lang}.json`)
}

if (!localStorage.getItem("lang")) {
    localStorage.setItem("lang", (navigator.language || navigator.userLanguage).substr(0, 2).toLowerCase())
}

export function getLoc(id) {
    const lang = localStorage.getItem("lang")
    if (id.startsWith("role_"))
        return translations[lang]?.[id] || translations["ru"]?.[id] || id.substr(5)
    return translations[lang]?.[id] || translations["ru"]?.[id] || "something gone wrong"
}