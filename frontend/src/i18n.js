const titles = {
  en: 'Finn\u2019s Landzunge \u2014 Bionode // Green Sector // Uplink Est. 2019',
  de: 'Finn\u2019s Landzunge \u2014 Bioknoten // Gr\u00fcner Sektor // Uplink Gest. 2019'
}

function applyLang(lang) {
  document.querySelectorAll('[data-' + lang + ']').forEach(function (el) {
    el.innerHTML = el.getAttribute('data-' + lang)
  })
  document.documentElement.lang = lang
  document.title = titles[lang]
  document.getElementById('lang-toggle').textContent = lang === 'en' ? 'DE' : 'EN'
  localStorage.setItem('lang', lang)
  document.dispatchEvent(new CustomEvent('landzunge:langchange', { detail: { lang } }))
}

export function initI18n() {
  document.getElementById('lang-toggle').addEventListener('click', function () {
    applyLang(document.documentElement.lang === 'en' ? 'de' : 'en')
  })
  applyLang(localStorage.getItem('lang') || 'en')
}
