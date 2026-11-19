/**
 * Projetos públicos do GitHub, congelados na data da coleta.
 * Descrições e linguagens vêm do perfil público github.com/ohmyguigs.
 * O site não consulta a API do GitHub.
 */

export const GITHUB = Object.freeze({
  profileUrl: 'https://github.com/ohmyguigs',
  repoUrl: 'https://github.com/ohmyguigs/bem-vinde',
  bio: 'General problem solver & Bringer of happiness @ Earth',
  collectedAt: '2026-11-19',
});

export const PROJECTS = Object.freeze([
  {
    name: 'bem-vinde',
    url: 'https://github.com/ohmyguigs/bem-vinde',
    description: 'Este site: um laboratório de acessibilidade, Core Web Vitals, JavaScript puro e Tailwind CSS.',
    language: 'HTML · Tailwind CSS · JavaScript',
    year: 2026,
  },
  {
    name: 'timer',
    url: 'https://github.com/ohmyguigs/timer',
    description: 'Um timer usando sveltkit, com picture-in-picture para apresentar reuniões',
    language: 'JavaScript, svelt',
    year: 2022,
  },
  {
    name: 'autos-e-baixos-gallery',
    url: 'https://github.com/ohmyguigs/autos-e-baixos-gallery',
    description: 'Galeria de arte 3D com os prints dos melhores momentos jogando gartic com o time de autos OLX',
    language: 'JavaScript, REGL',
    year: 2021,
  },
]);
