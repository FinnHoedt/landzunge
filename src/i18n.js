const titles = {
  en: 'Finn\u2019s Landzunge \u2014 Protected Natural Heritage Site',
  de: 'Finn\u2019s Landzunge \u2014 Gesch\u00fctztes Naturdenkmal'
}

function applyLang(lang) {
  document.querySelectorAll('[data-' + lang + ']').forEach(function (el) {
    el.innerHTML = el.getAttribute('data-' + lang)
  })
  document.documentElement.lang = lang
  document.title = titles[lang]
  document.getElementById('lang-toggle').textContent = lang === 'en' ? 'DE' : 'EN'
  localStorage.setItem('lang', lang)
}

export function initI18n() {
  document.getElementById('lang-toggle').addEventListener('click', function () {
    applyLang(document.documentElement.lang === 'en' ? 'de' : 'en')
  })
  applyLang(localStorage.getItem('lang') || 'en')
}
