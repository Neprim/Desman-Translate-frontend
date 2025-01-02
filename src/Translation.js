const translations = {
    ru: require("./translations/ru.json")
}

if (!localStorage.getItem("lang")) {
    localStorage.setItem("lang", (navigator.language || navigator.userLanguage).substr(0, 2).toLowerCase())
}

export function getLoc(id) {
    const lang = localStorage.getItem("lang")
    return translations[lang]?.[id] || translations["ru"]?.[id] || "something gone wrong"
}