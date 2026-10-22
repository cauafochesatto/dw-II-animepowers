// Script to map local images to powers
const fs = require('fs');
const path = require('path');

const powersPath = path.join(__dirname, 'src', 'data', 'powers.json');
const powers = JSON.parse(fs.readFileSync(powersPath, 'utf8'));

const imageMap = {
  1: 'rasengan.jpg',
  2: 'chidori.jpg',
  3: 'gomugomunogatling.jpg',
  4: 'entei.jpg',
  5: 'kamehamenha.jpg',
  6: 'finalflash.jpg',
  7: 'jajaken.jpg',
  8: 'bungeegum.jpg',
  9: 'kagura.jpg',
  10: 'respiracaoagua.jpg',
  11: 'oraora.jpg',
  12: 'zawarudo.jpg',
  13: 'Getsuga.jpg',
  14: 'senbonzaukura.jpg',
  15: 'frieren.jpg',
  16: 'sukunasantuario.jpg',
  17: 'vazioilimitado.jpg',
  18: 'smash.jpg',
  19: 'Amaterasu.jpg',
  20: 'Shinra Tensei.jpg',
  21: 'kamui.jpg',
  22: 'bajranggun.jpg',
  23: 'santoryu.jpg',
  24: 'opeope.jpg',
  25: 'diablejambe.jpg',
  26: 'genkidama.jpg',
  27: 'hakai.jpg',
  28: 'instintosuperior.jpg',
  29: 'makankasappo.jpg',
  30: 'kanmuru.jpg',
  31: 'netero.jpg',
  32: 'zenitsu.jpg',
  33: 'kagura.jpg', // fallback - Respiração da Névoa
  34: 'zawarudo.jpg', // fallback - King Crimson
  35: 'Goldexperience.jpg',
  36: 'mugetsufinal.jpg',
  37: 'kyoka.jpg',
  38: 'vazioroxo.jpg',
  39: 'furianegra.jpg',
  40: 'prominennce.jpg',
  41: 'decay.jpg',
  42: 'titafundador.jpg',
  43: 'titacolossal.jpg',
  44: 'arise.jpg',
  45: 'autoridadedogovernante.jpg',
  46: 'cortedimensional.jpg',
  47: 'antimagia.jpg', // Note: file has backslash in name
  48: 'alquimiadaschamas.jpg',
  49: 'semcirculo.jpg',
  50: 'seriouspunch.jpg',
  51: 'punhodeagua.jpg',
  52: 'explosaopsiquica.jpg',
  53: 'zoltraak.jpg',
  54: 'chainsaw.jpg'
};

powers.forEach(power => {
  if (imageMap[power.id]) {
    power.imagem = `/imagenspoderes/${imageMap[power.id]}`;
  }
});

fs.writeFileSync(powersPath, JSON.stringify(powers, null, 2));
console.log('powers.json updated with local images');